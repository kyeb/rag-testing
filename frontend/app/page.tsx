"use client";

import { useState, useEffect } from "react";
import { Editor, EditorState } from "draft-js";
import "draft-js/dist/Draft.css";

export default function Home() {
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  useEffect(() => {
    setEditorState(EditorState.createEmpty());
  }, []);

  if (!editorState) return null;
  console.log(editorState);

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
    </div>
  );
}
