import { notFound } from 'next/navigation';
import { formatSlug, getMarkdownContent } from '@/lib/markdown-utils';
import MarkdownLayout from '@/components/MarkdownLayout';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface MarkdownInFolderPageProps {
  params: Promise<{
    folderName: string;
    slug: string;
  }>;
}

export default async function MarkdownInFolderPage({ params }: MarkdownInFolderPageProps) {
  const resolvedParams = await params;
  const { folderName, slug } = resolvedParams;

  const markdownData = await getMarkdownContent(slug, folderName);

  if (!markdownData) {
    return notFound();
  }

  const { title, content } = markdownData;

  return (
    <MarkdownLayout
      title={title}
      backLink={{
        href: `/markdown/folder/${encodeURIComponent(folderName)}`,
        label: `Back to ${formatSlug(folderName)}`,
      }}
    >
      <MarkdownRenderer content={content} />
    </MarkdownLayout>
  );
}
