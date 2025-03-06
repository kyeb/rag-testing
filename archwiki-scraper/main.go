package main

import (
	"flag"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"sync/atomic"

	"github.com/gocolly/colly"
	"github.com/gocolly/colly/queue"
)

var (
	baseURL    = "https://wiki.archlinux.org"
	outputDir  string
	maxDepth   = flag.Int("depth", 100, "maximum crawl depth")
	concurrent = flag.Int("concurrent", 5, "number of concurrent scrapers")
	rateLimit  = flag.Duration("rate", 1*time.Second, "time to wait between requests")
	maxFiles   = flag.Int("max-files", 100, "maximum number of files to scrape")
)

var (
	visitedURLs    = make(map[string]int)
	urlMutex       sync.RWMutex
	uncrawledLinks = make(map[string]string) // map[url]reason
	uncrawledMutex sync.RWMutex
)

var queuedFiles atomic.Int32

func main() {
	flag.StringVar(&outputDir, "output", "output", "directory to store markdown files")
	flag.Parse()

	log.Printf("Starting scraper with depth=%d, concurrent=%d, rate=%v, output=%s",
		*maxDepth, *concurrent, *rateLimit, outputDir)

	if err := os.RemoveAll(outputDir); err != nil {
		log.Printf("Warning: Failed to remove output directory: %v", err)
	}
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		log.Fatal(err)
	}

	c := colly.NewCollector(
		colly.AllowedDomains("wiki.archlinux.org"),
		colly.URLFilters(
			// Only match English pages - exclude pages with language codes like (简体中文) or (Español)
			regexp.MustCompile(`^https://wiki\.archlinux\.org/title/[^(]+$`),
		),
		colly.UserAgent("Testing scraping tool (+mailto:scraping@kyeb.com)"),
	)

	q, _ := queue.New(
		*concurrent,
		&queue.InMemoryQueueStorage{MaxSize: 10000},
	)

	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		Parallelism: *concurrent,
		RandomDelay: *rateLimit,
	})

	c.OnRequest(func(r *colly.Request) {
		log.Printf("Visiting %s", r.URL)
	})

	c.OnHTML("div#mw-content-text", func(e *colly.HTMLElement) {
		pageURL := e.Request.URL.String()
		log.Printf("Processing content from %s", pageURL)

		// Strip anchor from URL
		pageURL = strings.Split(pageURL, "#")[0]

		title := e.DOM.Parent().Find("h1#firstHeading").Text()
		if title == "" {
			title = strings.TrimPrefix(e.Request.URL.Path, "/title/")
			title = strings.ReplaceAll(title, "_", " ")
		}

		markdown := ConvertToMarkdown(e.DOM)
		if markdown == "" {
			log.Printf("Warning: No content extracted from %s", pageURL)
			return
		}

		filename := urlToFilename(pageURL)
		log.Printf("Saving to %s", filename)
		if err := savePage(filename, markdown, pageURL, title); err != nil {
			log.Printf("Error saving %s: %v", filename, err)
		}

		urlMutex.RLock()
		currentDepth := visitedURLs[pageURL]
		urlMutex.RUnlock()

		if currentDepth < *maxDepth {
			linkCount := 0
			addedLinkCount := 0
			hitMaxFiles := false
			e.ForEach("a[href]", func(_ int, el *colly.HTMLElement) {
				href := el.Attr("href")
				if strings.HasPrefix(href, "/title/") && !strings.Contains(href, ":") {
					fullURL := baseURL + href

					// Ignore anchor; they're just links to subheaders within a page
					fullURL = strings.Split(fullURL, "#")[0]

					linkCount++

					urlMutex.RLock()
					_, exists := visitedURLs[fullURL]
					urlMutex.RUnlock()

					if !exists {
						queuedFiles.Add(1)
						if queuedFiles.Load() >= int32(*maxFiles) || currentDepth >= *maxDepth {
							reason := "max_files_limit"
							if currentDepth >= *maxDepth {
								reason = "max_depth"
							}
							uncrawledMutex.Lock()
							uncrawledLinks[fullURL] = reason
							uncrawledMutex.Unlock()

							if queuedFiles.Load() >= int32(*maxFiles) {
								hitMaxFiles = true
								return
							}
						} else {
							urlMutex.Lock()
							visitedURLs[fullURL] = currentDepth + 1
							urlMutex.Unlock()

							q.AddURL(fullURL)
							addedLinkCount++
						}
					}
				}
			})
			if hitMaxFiles {
				log.Printf("Reached max files limit (%d), queued %d links out of %d", *maxFiles, addedLinkCount, linkCount)
			} else {
				log.Printf("Queued %d links from %s (depth %d)", addedLinkCount, pageURL, currentDepth)
			}
		} else {
			log.Printf("Reached max depth (%d) for %s, not queuing more links", *maxDepth, pageURL)
		}
	})

	c.OnError(func(r *colly.Response, err error) {
		log.Printf("Error scraping %s: %v", r.Request.URL, err)
	})

	startURL := baseURL + "/title/Arch_Linux"
	log.Printf("Starting with URL: %s", startURL)
	urlMutex.Lock()
	visitedURLs[startURL] = 0
	urlMutex.Unlock()
	q.AddURL(startURL)

	log.Printf("Starting queue processing")
	q.Run(c)

	if err := writeUncrawledLinks(); err != nil {
		log.Printf("Error writing uncrawled links: %v", err)
	}

	fmt.Println("Scraping completed!")
}

func urlToFilename(pageURL string) string {
	u, err := url.Parse(pageURL)
	if err != nil {
		return "unknown.md"
	}

	path := strings.TrimPrefix(u.Path, "/title/")
	return filepath.Join(outputDir, path+".md")
}

func convertWikiLinks(content, currentFile string) string {
	re := regexp.MustCompile(`\[([^\]]+)\]\(/title/([^#\)]+)(?:#([^\)]+))?\)`)

	return re.ReplaceAllStringFunc(content, func(match string) string {
		submatches := re.FindStringSubmatch(match)
		if len(submatches) < 3 {
			return match
		}

		linkText := submatches[1]
		wikiPath := submatches[2]
		anchor := ""
		if len(submatches) > 3 && submatches[3] != "" {
			anchor = "#" + submatches[3]
		}

		// Get the relative path from current file to target file
		currentDir := filepath.Dir(strings.TrimPrefix(currentFile, outputDir+"/"))
		targetPath := wikiPath

		// Calculate relative path
		var relPath string
		if currentDir == "." {
			relPath = targetPath + ".md"
		} else {
			// Count directory levels and add appropriate ../
			depth := len(strings.Split(currentDir, "/"))
			prefix := strings.Repeat("../", depth-1)
			relPath = prefix + targetPath + ".md"
		}

		return fmt.Sprintf("[%s](%s%s)", linkText, relPath, anchor)
	})
}

func savePage(filename, content, pageURL, title string) error {
	dir := filepath.Dir(filename)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	content = convertWikiLinks(content, filename)

	content = fmt.Sprintf("---\ntitle: %s\nurl: %s\ndate_scraped: %s\n---\n\n%s",
		title,
		pageURL,
		time.Now().Format(time.RFC3339),
		content)

	return os.WriteFile(filename, []byte(content), 0644)
}

func writeUncrawledLinks() error {
	uncrawledMutex.RLock()
	defer uncrawledMutex.RUnlock()

	if len(uncrawledLinks) == 0 {
		return nil
	}

	f, err := os.Create(filepath.Join(outputDir, "uncrawled_links.txt"))
	if err != nil {
		return fmt.Errorf("failed to create uncrawled links file: %v", err)
	}
	defer f.Close()

	for url, reason := range uncrawledLinks {
		if _, err := fmt.Fprintf(f, "%s\t%s\n", url, reason); err != nil {
			return fmt.Errorf("failed to write uncrawled link: %v", err)
		}
	}
	return nil
}
