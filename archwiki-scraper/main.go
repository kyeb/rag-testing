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

	"github.com/gocolly/colly"
	"github.com/gocolly/colly/queue"
)

var (
	baseURL     = "https://wiki.archlinux.org"
	outputDir   string
	maxDepth    = flag.Int("depth", 100, "maximum crawl depth")
	concurrent  = flag.Int("concurrent", 5, "number of concurrent scrapers")
	rateLimit   = flag.Duration("rate", 5*time.Second, "time to wait between requests")
	maxFiles    = flag.Int("max-files", 100, "maximum number of files to scrape")
)

var (
	visitedURLs = make(map[string]int)
	urlMutex    sync.RWMutex
)

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
			e.ForEach("a[href]", func(_ int, el *colly.HTMLElement) {
				href := el.Attr("href")
				if strings.HasPrefix(href, "/title/") && !strings.Contains(href, ":") {
					fullURL := baseURL + href

					urlMutex.RLock()
					_, exists := visitedURLs[fullURL]
					urlMutex.RUnlock()

					if !exists {
						urlMutex.Lock()
						visitedURLs[fullURL] = currentDepth + 1
						urlMutex.Unlock()

						q.AddURL(fullURL)
						linkCount++
					}
				}
			})
			log.Printf("Queued %d links from %s (depth %d)", linkCount, pageURL, currentDepth)
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

func calculateRelativePath(fromFile, toFile string) string {
	fromRel := strings.TrimPrefix(fromFile, outputDir+"/")
	toRel := strings.TrimPrefix(toFile, outputDir+"/")

	fromParts := strings.Split(filepath.Dir(fromRel), "/")
	toParts := strings.Split(filepath.Dir(toRel), "/")

	commonLen := 0
	for i := 0; i < len(fromParts) && i < len(toParts); i++ {
		if fromParts[i] != toParts[i] {
			break
		}
		commonLen++
	}

	var relPath strings.Builder
	
	for i := commonLen; i < len(fromParts); i++ {
		relPath.WriteString("../")
	}
	
	if commonLen < len(toParts) {
		relPath.WriteString(strings.Join(toParts[commonLen:], "/"))
		if len(toParts[commonLen:]) > 0 {
			relPath.WriteString("/")
		}
	}
	
	relPath.WriteString(filepath.Base(toRel))
	
	return relPath.String()
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