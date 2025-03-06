import React from 'react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  details?: string;
  type?: 'error' | 'warning';
}

export default function ErrorDisplay({
  title = 'Error',
  message,
  details,
  type = 'error',
}: ErrorDisplayProps) {
  const bgColor = type === 'error' ? 'bg-red-50' : 'bg-yellow-50';
  const textColor = type === 'error' ? 'text-red-800' : 'text-yellow-800';

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className={`p-4 border rounded ${bgColor} ${textColor}`}>
        <p>{message}</p>
        {details && <p className="mt-2">{details}</p>}
      </div>
    </div>
  );
}
