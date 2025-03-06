import React, { ReactNode } from 'react';
import NavigationLink from './NavigationLink';

interface MarkdownLayoutProps {
  title: string;
  date?: string;
  backLink?: {
    href: string;
    label: string;
  };
  children: ReactNode;
}

export default function MarkdownLayout({ title, date, backLink, children }: MarkdownLayoutProps) {
  return (
    <div className="container mx-auto p-6">
      {backLink && <NavigationLink href={backLink.href} label={backLink.label} />}

      <h1 className="text-3xl font-bold mb-6">{title}</h1>

      {date && <p className="text-gray-600 mb-4">{new Date(date).toLocaleDateString()}</p>}

      {children}
    </div>
  );
}
