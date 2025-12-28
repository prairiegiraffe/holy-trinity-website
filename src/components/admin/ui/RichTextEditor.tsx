import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return <div className="editor-loading">Loading editor...</div>;
  }

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "active" : ""}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "active" : ""}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "active" : ""}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={editor.isActive("heading", { level: 3 }) ? "active" : ""}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "active" : ""}
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "active" : ""}
            title="Numbered List"
          >
            1. List
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "active" : ""}
            title="Quote"
          >
            " Quote
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            ―
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={setLink}
            className={editor.isActive("link") ? "active" : ""}
            title="Add Link"
          >
            🔗
          </button>
          <button type="button" onClick={addImage} title="Add Image">
            🖼️
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            ↩
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            ↪
          </button>
        </div>
      </div>

      <EditorContent editor={editor} className="editor-content" />

      <style>{`
        .rich-text-editor {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          overflow: hidden;
        }

        .editor-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          padding: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f7fafc;
        }

        .toolbar-group {
          display: flex;
          gap: 0.125rem;
          padding-right: 0.5rem;
          border-right: 1px solid #e2e8f0;
        }

        .toolbar-group:last-child {
          border-right: none;
        }

        .editor-toolbar button {
          padding: 0.375rem 0.625rem;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8125rem;
          color: #4a5568;
          transition: all 0.15s;
        }

        .editor-toolbar button:hover {
          background: #edf2f7;
          color: #1a202c;
        }

        .editor-toolbar button.active {
          background: #2c5282;
          color: white;
        }

        .editor-toolbar button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .editor-content {
          min-height: 300px;
          max-height: 600px;
          overflow-y: auto;
        }

        .editor-content .ProseMirror {
          padding: 1rem;
          min-height: 300px;
          outline: none;
        }

        .editor-content .ProseMirror p.is-editor-empty:first-child::before {
          color: #a0aec0;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .editor-content .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1.5rem 0 0.75rem;
        }

        .editor-content .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem;
        }

        .editor-content .ProseMirror p {
          margin: 0.75rem 0;
          line-height: 1.6;
        }

        .editor-content .ProseMirror ul,
        .editor-content .ProseMirror ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }

        .editor-content .ProseMirror li {
          margin: 0.25rem 0;
        }

        .editor-content .ProseMirror blockquote {
          border-left: 4px solid #e2e8f0;
          margin: 1rem 0;
          padding-left: 1rem;
          color: #718096;
          font-style: italic;
        }

        .editor-content .ProseMirror hr {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 1.5rem 0;
        }

        .editor-content .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .editor-content .ProseMirror a {
          color: #2c5282;
          text-decoration: underline;
        }

        .editor-loading {
          padding: 2rem;
          text-align: center;
          color: #718096;
        }
      `}</style>
    </div>
  );
}
