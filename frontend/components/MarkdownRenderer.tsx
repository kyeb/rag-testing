import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nord } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Link from "next/link";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div className={`prose prose-slate lg:prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold my-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold my-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-bold my-2" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-lg font-bold my-2" {...props} />
          ),
          p: ({ node, ...props }) => <p className="my-2" {...props} />,
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 my-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 my-2" {...props} />
          ),
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
          a: ({ node, href, children, ...props }: any) => {
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
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          strong: ({ node, ...props }) => (
            <strong className="font-bold" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 pl-4 italic my-2"
              {...props}
            />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <SyntaxHighlighter
                style={nord}
                language={match[1]}
                PreTag="div"
                className="rounded-md my-4"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-gray-100 px-1 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
