import { notFound } from 'next/navigation';
import {
  MARKDOWN_DIR,
  pathExists,
  listMarkdownFiles,
  getMarkdownContent,
} from '@/lib/markdown-utils';
import MarkdownLayout from '@/components/MarkdownLayout';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface MarkdownPageProps {
  params: {
    slug: string;
  };
}

export default async function MarkdownPage({ params }: MarkdownPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;

  const markdownData = await getMarkdownContent(slug);

  if (!markdownData) {
    return notFound();
  }

  const { title, content, frontmatter } = markdownData;

  return (
    <MarkdownLayout
      title={title}
      date={frontmatter.date}
      backLink={{
        href: '/markdown',
        label: 'Back to list',
      }}
    >
      <MarkdownRenderer content={content} />
    </MarkdownLayout>
  );
}

export async function generateStaticParams() {
  if (!pathExists(MARKDOWN_DIR)) {
    console.error(`Markdown directory not found: ${MARKDOWN_DIR}`);
    return [];
  }

  try {
    const markdownFiles = await listMarkdownFiles();

    return markdownFiles.map(filename => ({
      slug: filename.replace('.md', ''),
    }));
  } catch (error) {
    console.error('Error reading markdown directory:', error);
    return [];
  }
}
