"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Editor, EditorState, Modifier, SelectionState } from "draft-js";
import "draft-js/dist/Draft.css";

interface FloatingButtonPosition {
  top: number;
  left: number;
}

export default function Home() {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [buttonPosition, setButtonPosition] =
    useState<FloatingButtonPosition | null>(null);
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditorState(EditorState.createEmpty());

    // Add click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editorRef.current &&
        !editorRef.current.contains(event.target as Node)
      ) {
        setIsButtonVisible(false);
        setTimeout(() => setButtonPosition(null), 150);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const updateButtonPosition = useCallback(() => {
    if (!editorState) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setIsButtonVisible(false);
      setTimeout(() => setButtonPosition(null), 150);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Check if selection is within editor bounds
    if (!editorRef.current?.contains(selection.anchorNode)) {
      setIsButtonVisible(false);
      setTimeout(() => setButtonPosition(null), 150);
      return;
    }

    if (rect.width === 0) {
      setIsButtonVisible(false);
      setTimeout(() => setButtonPosition(null), 150);
      return;
    }

    // Set position first, then trigger visibility
    setButtonPosition({
      top: rect.top - 25,
      left: rect.left + rect.width / 2 - 50,
    });

    // Use RAF to ensure position is set before showing
    requestAnimationFrame(() => {
      setIsButtonVisible(true);
    });
  }, [editorState]);

  const handleChange = (newState: EditorState) => {
    setEditorState(newState);
    setTimeout(updateButtonPosition, 0);
  };

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
      const response = await fetch("/api/edit", {
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
    <div className="p-4 relative">
      <h1 className="text-2xl font-bold mb-4">Draft.js Editor Example</h1>
      <div ref={editorRef} className="border p-4 rounded-lg min-h-128 bg-white">
        <Editor
          editorState={editorState}
          onChange={handleChange}
          placeholder="Start typing..."
        />
      </div>
      <div
        style={{
          position: "fixed",
          top: buttonPosition?.top ?? 0,
          left: buttonPosition?.left ?? 0,
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          opacity: isButtonVisible && buttonPosition ? 1 : 0,
          transition: "opacity 150ms ease-in-out",
          pointerEvents: isButtonVisible && buttonPosition ? "auto" : "none",
          visibility: buttonPosition ? "visible" : "hidden",
        }}
      >
        <button
          onClick={handleTransformClick}
          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors shadow-lg"
        >
          Transform
        </button>
      </div>
    </div>
  );
}
