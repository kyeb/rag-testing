import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MARKDOWN_DIR, formatSlug, pathExists } from "@/lib/markdown-utils";
import MarkdownLayout from "@/components/MarkdownLayout";
import ErrorDisplay from "@/components/ErrorDisplay";

interface FolderPageProps {
  params: {
    folderName: string;
  };
}

export default async function FolderPage({ params }: FolderPageProps) {
  // Ensure params are fully resolved
  const resolvedParams = await Promise.resolve(params);
  const { folderName } = resolvedParams;

  const folderPath = path.join(MARKDOWN_DIR, folderName);

  // Check if folder exists
  if (!pathExists(folderPath)) {
    return notFound();
  }

  // Read folder contents
  let items;
  try {
    items = await fs.readdir(folderPath, { withFileTypes: true });
  } catch (error) {
    console.error(`Error reading folder ${folderPath}:`, error);
    return (
      <ErrorDisplay
        type="error"
        title={`Folder: ${formatSlug(folderName)}`}
        message={`Error reading folder: ${folderPath}`}
        details={error instanceof Error ? error.message : String(error)}
      />
    );
  }

  // Filter for markdown files
  const markdownFiles = items
    .filter((item) => !item.isDirectory() && item.name.endsWith(".md"))
    .map((item) => ({
      name: item.name.replace(".md", ""),
      path: `/markdown/folder/${encodeURIComponent(
        folderName
      )}/${encodeURIComponent(item.name.replace(".md", ""))}`,
    }));

  return (
    <MarkdownLayout
      title={`Folder: ${formatSlug(folderName)}`}
      backLink={{
        href: "/markdown",
        label: "Back to all files",
      }}
    >
      <div className="grid gap-4">
        {markdownFiles.length > 0 ? (
          markdownFiles.map((file) => (
            <Link
              key={file.name}
              href={file.path}
              className="block p-4 border rounded hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-500"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>{formatSlug(file.name)}</span>
              </div>
            </Link>
          ))
        ) : (
          <p>No markdown files found in this folder</p>
        )}
      </div>
    </MarkdownLayout>
  );
}
