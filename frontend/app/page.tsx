"use client";

import { useState, useEffect } from "react";
import { Editor, EditorState, Modifier, SelectionState } from "draft-js";
import "draft-js/dist/Draft.css";

export default function Home() {
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  useEffect(() => {
    setEditorState(EditorState.createEmpty());
  }, []);

  const handleTransformClick = async () => {
    if (!editorState) return;

    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();

    if (!selection || !content || selection.isCollapsed()) {
      alert("Please select some text first!");
      return;
    }

    const selectedText = content
      .getBlockMap()
      .skipUntil((_, k) => k === selection.getStartKey())
      .takeUntil((_, k) => k === selection.getEndKey())
      .concat([
        [selection.getEndKey(), content.getBlockForKey(selection.getEndKey())],
      ])
      .map((block) => {
        if (!block) return "";
        const key = block.getKey();
        const start =
          key === selection.getStartKey() ? selection.getStartOffset() : 0;
        const end =
          key === selection.getEndKey()
            ? selection.getEndOffset()
            : block.getLength();
        return block.getText().slice(start, end);
      })
      .join("\n");

    try {
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: selectedText }),
      });

      const data = await response.json();

      // Replace the selected text with the transformed text
      const contentWithReplacedText = Modifier.replaceText(
        content,
        selection,
        data.transformedText
      );

      const newEditorState = EditorState.push(
        editorState,
        contentWithReplacedText,
        "insert-characters"
      );

      setEditorState(newEditorState);
    } catch (error) {
      console.error("Error transforming text:", error);
      alert("Failed to transform text. Please try again.");
    }
  };

  if (!editorState) return null;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Draft.js Editor Example</h1>
      <div className="border p-4 rounded-lg min-h-128 bg-white">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          placeholder="Start typing..."
        />
      </div>
      <button
        onClick={handleTransformClick}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Transform Selected Text
      </button>
    </div>
  );
}
