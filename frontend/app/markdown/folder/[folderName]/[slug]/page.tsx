import fs from 'fs';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getMarkdownFilePath, formatSlug, pathExists } from '@/lib/markdown-utils';

interface MarkdownInFolderPageProps {
  params: {
    folderName: string;
    slug: string;
  };
}

export default function MarkdownInFolderPage({ params }: MarkdownInFolderPageProps) {
  const { folderName, slug } = params;
  const filePath = getMarkdownFilePath(slug, folderName);
  
  // Check if file exists
  if (!pathExists(filePath)) {
    return notFound();
  }
  
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <Link 
          href={`/markdown/folder/${encodeURIComponent(folderName)}`} 
          className="inline-flex items-center text-blue-500 hover:text-blue-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
          Back to {formatSlug(folderName)}
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">{formatSlug(slug)}</h1>
      
      <div className="prose prose-slate lg:prose-lg max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
} 