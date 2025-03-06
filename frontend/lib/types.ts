/**
 * Types for markdown files and directories
 */
export interface MarkdownFile {
  name: string;
  isDirectory: false;
  path: string;
  slug: string;
}

export interface MarkdownDirectory {
  name: string;
  isDirectory: true;
  path: string;
}

export type MarkdownItem = MarkdownFile | MarkdownDirectory; 