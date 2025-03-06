import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const MARKDOWN_DIR = process.env.CONTENT_DIR || '/content';

export function formatSlug(slug: string): string {
  return slug.replace(/_/g, ' ');
}

export function getMarkdownFilePath(slug: string, folderName = ''): string {
  const fileName = `${slug}.md`;
  return path.join(MARKDOWN_DIR, folderName, fileName);
}

// Kept as sync for simplicity in conditionals
export function pathExists(pathToCheck: string): boolean {
  try {
    return existsSync(pathToCheck);
  } catch (error) {
    console.error(`Error checking if path exists: ${pathToCheck}`, error);
    return false;
  }
}

// Async version for file operations
export async function readMarkdownFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    throw new Error(`Failed to read markdown file: ${filePath}`);
  }
}

// Async version for directory listing
export async function listMarkdownFiles(dirPath = MARKDOWN_DIR): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    return files.filter(file => file.endsWith('.md'));
  } catch (error) {
    console.error(`Error listing files in directory: ${dirPath}`, error);
    return [];
  }
}

interface FrontMatter {
  [key: string]: any;
}

/**
 * Parses frontmatter from markdown content
 * Supports YAML frontmatter between --- delimiters
 */
export function parseFrontMatter(content: string): { frontmatter: FrontMatter; markdown: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      frontmatter: {},
      markdown: content
    };
  }
  
  try {
    // Simple YAML-like parsing (for a more robust solution, use a proper YAML parser)
    const frontmatterStr = match[1];
    const markdown = match[2];
    
    const frontmatter: FrontMatter = {};
    const lines = frontmatterStr.split('\n');
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        
        // Convert to appropriate types
        if (value === 'true') frontmatter[key] = true;
        else if (value === 'false') frontmatter[key] = false;
        else if (/^\d+$/.test(value)) frontmatter[key] = parseInt(value, 10);
        else if (/^\d+\.\d+$/.test(value)) frontmatter[key] = parseFloat(value);
        else frontmatter[key] = value;
      }
    }
    
    return { frontmatter, markdown };
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return {
      frontmatter: {},
      markdown: content
    };
  }
} 