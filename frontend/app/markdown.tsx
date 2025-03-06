import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactMarkdown from 'react-markdown';

const MarkdownPage = () => {
  const markdownDir = path.join(process.cwd(), 'archwiki-scraper/output');
  const filenames = fs.readdirSync(markdownDir);
  const markdownFiles = filenames.filter(file => file.endsWith('.md'));

  const markdownContent = markdownFiles.map(filename => {
    const filePath = path.join(markdownDir, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return { filename, content: fileContents };
  });

  return (
    <div>
      <h1>Markdown Files</h1>
      {markdownContent.map(({ filename, content }) => (
        <div key={filename}>
          <h2>{filename}</h2>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ))}
    </div>
  );
};

export default MarkdownPage; 