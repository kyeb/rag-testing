package main

import (
	"fmt"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

func ConvertToMarkdown(s *goquery.Selection) string {
	var result strings.Builder

	title := s.Find("h1#firstHeading").Text()
	if title != "" {
		result.WriteString("# " + strings.TrimSpace(title) + "\n\n")
	}

	content := s.Find("div.mw-parser-output")
	if content.Length() == 0 {
		return ""
	}

	content.Children().Each(func(i int, s *goquery.Selection) {
		if shouldSkipElement(s) {
			return
		}

		if heading := processHeading(s); heading != "" {
			result.WriteString(heading + "\n\n")
			return
		}

		if para := processParagraph(s); para != "" {
			result.WriteString(para + "\n\n")
			return
		}

		if list := processList(s); list != "" {
			result.WriteString(list + "\n\n")
			return
		}

		if code := processCodeBlock(s); code != "" {
			result.WriteString(code + "\n\n")
			return
		}

		if table := processTable(s); table != "" {
			result.WriteString(table + "\n\n")
			return
		}

		if s.Is("div") && !shouldSkipElement(s) {
			s.Children().Each(func(i int, s *goquery.Selection) {
				if para := processParagraph(s); para != "" {
					result.WriteString(para + "\n\n")
				}
			})
		}
	})

	return strings.TrimSpace(result.String())
}

func shouldSkipElement(s *goquery.Selection) bool {
	if s.HasClass("mw-jump-link") || s.HasClass("mw-editsection") || 
	   s.HasClass("vector-toc") || s.HasClass("mw-indicators") ||
	   s.HasClass("catlinks") || s.HasClass("printfooter") ||
	   s.HasClass("noprint") || s.HasClass("mw-empty-elt") ||
	   s.HasClass("mw-editsection-bracket") {
		return true
	}
	
	if id, exists := s.Attr("id"); exists {
		skippedIDs := []string{
			"mw-navigation",
			"mw-head",
			"siteNotice",
			"archnavbar",
			"footer",
			"mw-page-tools",
			"mw-site-navigation",
			"toc",
		}
		for _, skip := range skippedIDs {
			if id == skip {
				return true
			}
		}
	}
	
	return false
}

func processHeading(s *goquery.Selection) string {
	for i := 1; i <= 6; i++ {
		if s.Is(fmt.Sprintf("h%d", i)) {
			text := strings.TrimSpace(s.Text())
			if idx := strings.Index(text, "[edit]"); idx != -1 {
				text = strings.TrimSpace(text[:idx])
			}
			if text == "" {
				return ""
			}
			return strings.Repeat("#", i) + " " + text
		}
	}
	return ""
}

func processParagraph(s *goquery.Selection) string {
	if !s.Is("p") {
		return ""
	}

	var result strings.Builder
	s.Contents().Each(func(i int, s *goquery.Selection) {
		if s.Is("a") {
			href, exists := s.Attr("href")
			if exists {
				text := strings.TrimSpace(s.Text())
				if text == "" {
					return
				}
				if strings.HasPrefix(href, "/title/") {
					result.WriteString(fmt.Sprintf("[%s](%s)", text, href))
				} else if strings.HasPrefix(href, "http") {
					result.WriteString(fmt.Sprintf("[%s](%s)", text, href))
				} else {
					result.WriteString(text)
				}
			} else {
				result.WriteString(s.Text())
			}
			return
		}
		if s.Is("code") {
			result.WriteString(fmt.Sprintf("`%s`", s.Text()))
			return
		}
		if s.Is("i") || s.Is("em") {
			result.WriteString(fmt.Sprintf("_%s_", s.Text()))
			return
		}
		if s.Is("b") || s.Is("strong") {
			result.WriteString(fmt.Sprintf("**%s**", s.Text()))
			return
		}
		if goquery.NodeName(s) == "#text" {
			result.WriteString(s.Text())
		}
	})

	text := strings.TrimSpace(result.String())
	if text == "" {
		return ""
	}
	return text
}

func processList(s *goquery.Selection) string {
	if !s.Is("ul, ol") {
		return ""
	}

	var result strings.Builder
	s.Find("li").Each(func(i int, s *goquery.Selection) {
		prefix := "* "
		if s.Parent().Is("ol") {
			prefix = fmt.Sprintf("%d. ", i+1)
		}
		
		var itemText strings.Builder
		s.Contents().Each(func(i int, s *goquery.Selection) {
			if s.Is("a") {
				href, exists := s.Attr("href")
				if exists && strings.HasPrefix(href, "/title/") {
					itemText.WriteString(fmt.Sprintf("[%s](%s)", s.Text(), href))
					return
				}
			}
			if s.Is("code") {
				itemText.WriteString(fmt.Sprintf("`%s`", s.Text()))
				return
			}
			if s.Is("i") || s.Is("em") {
				itemText.WriteString(fmt.Sprintf("_%s_", s.Text()))
				return
			}
			if s.Is("b") || s.Is("strong") {
				itemText.WriteString(fmt.Sprintf("**%s**", s.Text()))
				return
			}
			if goquery.NodeName(s) == "#text" {
				itemText.WriteString(s.Text())
			}
		})
		
		text := strings.TrimSpace(itemText.String())
		if text != "" {
			result.WriteString(prefix + text + "\n")
		}
	})

	return strings.TrimSpace(result.String())
}

func processCodeBlock(s *goquery.Selection) string {
	if !s.Is("pre") {
		return ""
	}

	code := strings.TrimSpace(s.Text())
	if code == "" {
		return ""
	}

	lang := ""
	if s.HasClass("bash") {
		lang = "bash"
	} else if s.HasClass("shell") {
		lang = "shell"
	} else if s.HasClass("python") {
		lang = "python"
	}

	if lang != "" {
		return fmt.Sprintf("```%s\n%s\n```", lang, code)
	}
	return fmt.Sprintf("```\n%s\n```", code)
}

func processTable(s *goquery.Selection) string {
	if !s.Is("table") {
		return ""
	}

	var result strings.Builder
	
	headers := []string{}
	s.Find("tr").First().Find("th").Each(func(i int, s *goquery.Selection) {
		headers = append(headers, strings.TrimSpace(s.Text()))
	})

	if len(headers) == 0 {
		s.Find("tr").First().Find("td").Each(func(i int, s *goquery.Selection) {
			headers = append(headers, strings.TrimSpace(s.Text()))
		})
	}

	if len(headers) > 0 {
		result.WriteString("| " + strings.Join(headers, " | ") + " |\n")
		result.WriteString("|" + strings.Repeat(" --- |", len(headers)) + "\n")
	}
	
	s.Find("tr").Not(":first-child").Each(func(i int, s *goquery.Selection) {
		cells := []string{}
		s.Find("td").Each(func(j int, s *goquery.Selection) {
			cells = append(cells, strings.TrimSpace(s.Text()))
		})
		if len(cells) > 0 {
			result.WriteString("| " + strings.Join(cells, " | ") + " |\n")
		}
	})

	return strings.TrimSpace(result.String())
}