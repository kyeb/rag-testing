import React from 'react';
import Link from 'next/link';

interface NavigationLinkProps {
  href: string;
  label: string;
}

export default function NavigationLink({ href, label }: NavigationLinkProps) {
  return (
    <div className="mb-4">
      <Link href={href} className="inline-flex items-center text-blue-500 hover:text-blue-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <path d="m15 18-6-6 6-6"></path>
        </svg>
        {label}
      </Link>
    </div>
  );
}
