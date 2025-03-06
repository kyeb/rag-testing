package validate

import (
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
					continue
				}

				// Handle relative links
				targetPath := filepath.Join(filepath.Dir(path), linkTarget)
				if _, err := os.Stat(targetPath); os.IsNotExist(err) {
					errors = append(errors, fmt.Sprintf("Broken relative link in %s: [%s](%s) -> %s", path, linkText, linkTarget, targetPath))
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