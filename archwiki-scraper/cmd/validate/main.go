package main

import (
	"fmt"
	"log"
	"os"

	"github.com/kyeb/archwiki-scraper/validate"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: validate <output_dir>")
	}
	outputDir := os.Args[1]

	errors := validate.ValidateLinks(outputDir)
	if len(errors) > 0 {
		fmt.Println("\nFound link validation errors:")
		for _, err := range errors {
			fmt.Printf("- %s\n", err)
		}
		os.Exit(1)
	}
	fmt.Println("All links validated successfully!")
} 