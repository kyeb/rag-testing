package validate

import (
	"bufio"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// ValidateLinks checks all markdown files in the given directory for broken links
// Returns a list of error messages, or an empty list if all links are valid
func ValidateLinks(outputDir string) []string {
	var errors []string

	// Load uncrawled links if they exist
	uncrawledLinks := make(map[string]bool)
	uncrawledFile := filepath.Join(outputDir, "uncrawled_links.txt")
	if _, err := os.Stat(uncrawledFile); err == nil {
		file, err := os.Open(uncrawledFile)
		if err == nil {
			scanner := bufio.NewScanner(file)
			for scanner.Scan() {
				parts := strings.Split(scanner.Text(), "\t")
				if len(parts) > 0 {
					uncrawledLinks[parts[0]] = true
				}
			}
			file.Close()
		}
	}

	// Regular expression to match markdown links
	linkRegex := regexp.MustCompile(`\[([^\]]+)\]\(([^\)]+)\)`)

	err := filepath.Walk(outputDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && strings.HasSuffix(path, ".md") {
			content, err := os.ReadFile(path)
			if err != nil {
				return fmt.Errorf("error reading file %s: %v", path, err)
			}

			matches := linkRegex.FindAllStringSubmatch(string(content), -1)
			for _, match := range matches {
				if len(match) != 3 {
					continue
				}

				linkText := match[1]
				linkTarget := match[2]

				// Check if it's an absolute URL
				if strings.HasPrefix(linkTarget, "http://") || strings.HasPrefix(linkTarget, "https://") {
					_, err := url.Parse(linkTarget)
					if err != nil {
						errors = append(errors, fmt.Sprintf("Invalid URL in %s: [%s](%s)", path, linkText, linkTarget))
					}
					// Skip validation for uncrawled links
					if uncrawledLinks[linkTarget] {
						continue
					}
					continue
				}

				// Handle relative links
				if strings.Contains(linkTarget, "#") {
					parts := strings.Split(linkTarget, "#")
					linkTarget = parts[0]
					anchor := parts[1]

					// Check if the file exists
					targetPath := filepath.Join(filepath.Dir(path), linkTarget)
					if _, err := os.Stat(targetPath); os.IsNotExist(err) {
						// Convert relative path to absolute URL for checking against uncrawled links
						relPath := strings.TrimSuffix(linkTarget, ".md")
						if strings.HasPrefix(relPath, "../") {
							// Handle relative paths that go up directories
							parts := strings.Split(path, string(os.PathSeparator))
							depth := strings.Count(relPath, "../")
							if len(parts) > depth {
								relPath = strings.TrimPrefix(relPath, strings.Repeat("../", depth))
							}
						}
						absURL := "https://wiki.archlinux.org/title/" + relPath

						if !uncrawledLinks[absURL] {
							errors = append(errors, fmt.Sprintf("Broken relative link in %s: [%s](%s) -> %s", path, linkText, linkTarget, targetPath))
						}
					} else {
						// Check if the anchor exists in the file
						content, err := os.ReadFile(targetPath)
						if err == nil && !headerExists(string(content), anchor) {
							errors = append(errors, fmt.Sprintf("Broken anchor in %s: [%s](%s) -> %s", path, linkText, linkTarget, targetPath))
						}
					}
				} else {
					// Handle links without anchors
					targetPath := filepath.Join(filepath.Dir(path), linkTarget)
					if _, err := os.Stat(targetPath); os.IsNotExist(err) {
						// Convert relative path to absolute URL for checking against uncrawled links
						relPath := strings.TrimSuffix(linkTarget, ".md")
						if strings.HasPrefix(relPath, "../") {
							// Handle relative paths that go up directories
							parts := strings.Split(path, string(os.PathSeparator))
							depth := strings.Count(relPath, "../")
							if len(parts) > depth {
								relPath = strings.TrimPrefix(relPath, strings.Repeat("../", depth))
							}
						}
						absURL := "https://wiki.archlinux.org/title/" + relPath

						if !uncrawledLinks[absURL] {
							errors = append(errors, fmt.Sprintf("Broken relative link in %s: [%s](%s) -> %s", path, linkText, linkTarget, targetPath))
						}
					}
				}
			}
		}
		return nil
	})

	if err != nil {
		errors = append(errors, fmt.Sprintf("Error walking directory: %v", err))
	}

	return errors
}

// Function to check if a header exists in the file
func headerExists(content string, anchor string) bool {
	headerRegex := regexp.MustCompile(`(?m)^#+\s+` + regexp.QuoteMeta(anchor) + `$`)
	return headerRegex.MatchString(content)
}
