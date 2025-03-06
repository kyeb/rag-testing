package main

import (
	"os"
	"strings"
	"testing"

	"github.com/PuerkitoBio/goquery"
)

func TestConvertToMarkdown(t *testing.T) {
	// Read test file
	f, err := os.Open("testdata/arch_linux.html")
	if err != nil {
		t.Fatalf("Failed to open test file: %v", err)
	}
	defer f.Close()

	// Parse HTML
	doc, err := goquery.NewDocumentFromReader(f)
	if err != nil {
		t.Fatalf("Failed to parse HTML: %v", err)
	}

	// Convert to markdown
	markdown := ConvertToMarkdown(doc.Find("div#mw-content-text"))

	// Verify expected content
	expectedParts := []string{
		"Arch Linux is an independently developed, x86-64 general-purpose [GNU](/title/GNU)/Linux distribution",
		"## Principles",
		"### Simplicity",
		"Arch Linux defines simplicity as _without unnecessary additions or modifications_",
		"[upstream](https://en.wikipedia.org/wiki/Upstream_(software_development))",
		"### Modernity",
		"[systemd](/title/Systemd)",
		"[file systems](/title/File_systems)",
		"[mkinitcpio](/title/Mkinitcpio)",
		"### Pragmatism",
		"### User centrality",
	}

	for _, part := range expectedParts {
		if !strings.Contains(markdown, part) {
			t.Errorf("Expected markdown to contain %q, but it didn't", part)
		}
	}

	// Verify that unwanted elements are not included
	unwantedParts := []string{
		"mw-editsection",
		"[edit]",
		"navigation",
		"searchInput",
		"mw-head",
		"mw-panel",
	}
	for _, part := range unwantedParts {
		if strings.Contains(markdown, part) {
			t.Errorf("Markdown should not contain %q", part)
		}
	}

	// Verify formatting
	formattingTests := []struct {
		name     string
		contains string
		message  string
	}{
		{"Italics", "_without unnecessary additions or modifications_", "Should contain italicized text"},
		{"Links", "[GNU](/title/GNU)", "Should contain internal links"},
		{"External Links", "https://en.wikipedia.org/wiki/", "Should contain external links"},
		{"Headers", "## Principles", "Should contain section headers"},
		{"Subheaders", "### Simplicity", "Should contain subsection headers"},
	}

	for _, tt := range formattingTests {
		if !strings.Contains(markdown, tt.contains) {
			t.Errorf("%s: %s", tt.name, tt.message)
		}
	}

	// Verify heading hierarchy
	headings := []string{
		"## Principles",
		"### Simplicity",
		"### Modernity",
		"### Pragmatism",
		"### User centrality",
	}
	lastIndex := -1
	for _, heading := range headings {
		currentIndex := strings.Index(markdown, heading)
		if currentIndex == -1 {
			t.Errorf("Expected to find heading %q", heading)
		} else if currentIndex < lastIndex {
			t.Errorf("Heading %q appears out of order", heading)
		}
		lastIndex = currentIndex
	}

	// Verify whitespace handling
	if strings.Contains(markdown, "\n\n\n") {
		t.Error("Markdown contains excessive blank lines")
	}

	// Verify link formatting
	if strings.Contains(markdown, "](/title//") {
		t.Error("Found malformed internal link with double slash")
	}
	if strings.Contains(markdown, "](https://https://") {
		t.Error("Found malformed external link with double protocol")
	}
} 