package main

import (
	"testing"
)

func TestConvertWikiLinks(t *testing.T) {
	tests := []struct {
		name        string
		content     string
		currentFile string
		want        string
	}{
		{
			name:        "simple link",
			content:     "[GNU](/title/GNU)",
			currentFile: "output/Arch_Linux.md",
			want:        "[GNU](GNU.md)",
		},
		{
			name:        "link with anchor",
			content:     "[Project Leader](/title/DeveloperWiki:Project_Leader#history)",
			currentFile: "output/Arch_Linux.md",
			want:        "[Project Leader](DeveloperWiki:Project_Leader.md#history)",
		},
		{
			name:        "link from nested directory",
			content:     "[Arch Linux](/title/Arch_Linux)",
			currentFile: "output/DeveloperWiki/Project_Leader.md",
			want:        "[Arch Linux](../Arch_Linux.md)",
		},
		{
			name:        "multiple links",
			content:     "Check out [GNU](/title/GNU) and [systemd](/title/Systemd)",
			currentFile: "output/Arch_Linux.md",
			want:        "Check out [GNU](GNU.md) and [systemd](Systemd.md)",
		},
		{
			name:        "non-wiki links unchanged",
			content:     "[external](https://example.com) and [GNU](/title/GNU)",
			currentFile: "output/Arch_Linux.md",
			want:        "[external](https://example.com) and [GNU](GNU.md)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := convertWikiLinks(tt.content, tt.currentFile)
			if got != tt.want {
				t.Errorf("convertWikiLinks() = %v, want %v", got, tt.want)
			}
		})
	}
} 