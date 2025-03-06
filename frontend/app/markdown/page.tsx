import Link from "next/link";
import {
  MARKDOWN_DIR,
  pathExists,
  listDirectoryContents,
} from "@/lib/markdown-utils";
import ErrorDisplay from "@/components/ErrorDisplay";

export default async function MarkdownListingPage() {
  // Ensure directory exists before reading
  if (!pathExists(MARKDOWN_DIR)) {
    return (
      <ErrorDisplay
        type="warning"
        title="Markdown Files"
        message={`Could not find content directory at: ${MARKDOWN_DIR}`}
        details="Please ensure the /content directory exists in your Docker container. You may need to mount your content directory as a volume in Docker."
      />
    );
  }

  let allItems;
  try {
    allItems = await listDirectoryContents();
  } catch (error) {
    return (
      <ErrorDisplay
        type="error"
        title="Markdown Files"
        message={`Error reading directory: ${MARKDOWN_DIR}`}
        details={error instanceof Error ? error.message : String(error)}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Markdown Files</h1>

      <div className="grid gap-4">
        {allItems.length > 0 ? (
          allItems.map((item) => (
            <Link
              href={item.path}
              key={item.name}
              className="block p-4 border rounded hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                {item.isDirectory ? (
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
                    className="text-yellow-500"
                  >
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                  </svg>
                ) : (
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
                )}
                <span>
                  {item.isDirectory ? item.name : item.name.replace(".md", "")}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p>No markdown files found in {MARKDOWN_DIR}</p>
        )}
      </div>
    </div>
  );
}
