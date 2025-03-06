import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import { MARKDOWN_DIR, pathExists } from '@/lib/markdown-utils';

export default async function MarkdownListingPage() {
  // Ensure directory exists before reading
  if (!pathExists(MARKDOWN_DIR)) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Markdown Files</h1>
        <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
          <p>Could not find content directory at: {MARKDOWN_DIR}</p>
          <p className="mt-2">Please ensure the /content directory exists in your Docker container.</p>
          <p className="mt-2">You may need to mount your content directory as a volume in Docker.</p>
        </div>
      </div>
    );
  }
  
  let items;
  try {
    items = await fs.readdir(MARKDOWN_DIR, { withFileTypes: true });
  } catch (error) {
    console.error(`Error reading directory ${MARKDOWN_DIR}:`, error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Markdown Files</h1>
        <div className="p-4 border rounded bg-red-50 text-red-800">
          <p>Error reading directory: {MARKDOWN_DIR}</p>
          <p className="mt-2">Error: {error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }
  
  // Separate files and directories
  const markdownFiles = items
    .filter(item => !item.isDirectory() && item.name.endsWith('.md'))
    .map(item => ({
      name: item.name,
      isDirectory: false,
      path: `/markdown/${encodeURIComponent(item.name.replace('.md', ''))}`
    }));
    
  const directories = items
    .filter(item => item.isDirectory())
    .map(item => ({
      name: item.name,
      isDirectory: true,
      path: `/markdown/folder/${encodeURIComponent(item.name)}`
    }));
    
  const allItems = [...directories, ...markdownFiles];
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Markdown Files</h1>
      
      <div className="grid gap-4">
        {allItems.length > 0 ? (
          allItems.map(item => (
            <Link 
              href={item.path}
              key={item.name}
              className="block p-4 border rounded hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                {item.isDirectory ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                )}
                <span>{item.name}</span>
              </div>
            </Link>
          ))
        ) : (
          <p>No markdown files found in {MARKDOWN_DIR}</p>
        )}
      </div>
    </div>
  );
} 