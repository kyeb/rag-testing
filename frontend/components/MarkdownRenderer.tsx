import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Link from 'next/link';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        components={{
          h1: props => <h1 className="text-3xl font-bold my-4" {...props} />,
          h2: props => <h2 className="text-2xl font-bold my-3" {...props} />,
          h3: props => <h3 className="text-xl font-bold my-2" {...props} />,
          h4: props => <h4 className="text-lg font-bold my-2" {...props} />,
          p: props => <p className="my-2" {...props} />,
          ul: props => <ul className="list-disc pl-5 my-2" {...props} />,
          ol: props => <ol className="list-decimal pl-5 my-2" {...props} />,
          li: props => <li className="my-1" {...props} />,
          a: ({ href, children, ...props }) => {
            // Check if href exists
            if (!href) {
              return <span {...props}>{children}</span>;
            }

            // Check if external link
            const isExternal = href.startsWith('http://') || href.startsWith('https://');
            if (isExternal) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              );
            }

            // Handle relative links
            let internalHref = href;
            if (internalHref.endsWith('.md')) {
              internalHref = internalHref.replace('.md', '');
            }

            return (
              <Link href={internalHref} className="text-blue-600 hover:underline" {...props}>
                {children}
              </Link>
            );
          },
          em: props => <em className="italic" {...props} />,
          strong: props => <strong className="font-bold" {...props} />,
          blockquote: props => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <SyntaxHighlighter
                style={nord}
                language={match[1]}
                PreTag="div"
                className="rounded-md my-4"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
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
