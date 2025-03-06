import fs from "fs";
import path from "path";
import React from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { LinkProps } from "next/link";

const MarkdownPage = () => {
  const markdownDir = path.join(process.cwd(), "archwiki-scraper/output");
  const filenames = fs.readdirSync(markdownDir);
  const markdownFiles = filenames.filter((file) => file.endsWith(".md"));

  const markdownContent = markdownFiles.map((filename) => {
    const filePath = path.join(markdownDir, filename);
    const fileContents = fs.readFileSync(filePath, "utf8");
    return { filename, content: fileContents };
  });

  const CustomLink = ({ node, href, children, ...props }: any) => {
    // Relative link within the app
    if (href && href.includes(".md")) {
      const transformedHref = href.replace(/\.md$/, "");
      return (
        <Link href={transformedHref} {...props}>
          {children}
        </Link>
      );
    }

    // External link
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  };

  return (
    <div>
      <h1>Markdown Files</h1>
      {markdownContent.map(({ filename, content }) => (
        <div key={filename}>
          <h2>{filename}</h2>
          <ReactMarkdown components={{ a: CustomLink }}>
            {content}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
};

export default MarkdownPage;
