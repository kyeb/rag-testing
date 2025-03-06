import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { 
  MARKDOWN_DIR, 
  getMarkdownFilePath, 
  formatSlug, 
  pathExists,
  readMarkdownFile,
  listMarkdownFiles,
  parseFrontMatter
} from '@/lib/markdown-utils';

// Define the type for component props
interface MarkdownPageProps {
  params: {
    slug: string;
  };
}

export default async function MarkdownPage({ params }: MarkdownPageProps) {
  // Ensure params are fully resolved
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;
  
  const filePath = getMarkdownFilePath(slug);
  
  // Check if file exists
  if (!pathExists(filePath)) {
    console.error(`File not found: ${filePath}`);
    return notFound();
  }
  
  // Read the file content
  let fileContent: string;
  try {
    fileContent = await readMarkdownFile(filePath);
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Error</h1>
        <div className="p-4 border rounded bg-red-50 text-red-800">
          <p>Failed to read markdown file.</p>
        </div>
      </div>
    );
  }
  
  // Parse frontmatter and markdown content
  const { frontmatter, markdown } = parseFrontMatter(fileContent);
  const title = frontmatter.title || formatSlug(slug);
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <Link href="/markdown" className="inline-flex items-center text-blue-500 hover:text-blue-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
          Back to list
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      
      {frontmatter.date && (
        <p className="text-gray-600 mb-4">
          {new Date(frontmatter.date).toLocaleDateString()}
        </p>
      )}
      
      <div className="prose prose-slate lg:prose-lg max-w-none">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}

// Generate static paths for all markdown files
export async function generateStaticParams() {
  if (!pathExists(MARKDOWN_DIR)) {
    console.error(`Markdown directory not found: ${MARKDOWN_DIR}`);
    return [];
  }
  
  try {
    const markdownFiles = await listMarkdownFiles();
    
    return markdownFiles.map(filename => ({
      slug: filename.replace('.md', ''),
    }));
  } catch (error) {
    console.error('Error reading markdown directory:', error);
    return [];
  }
} 