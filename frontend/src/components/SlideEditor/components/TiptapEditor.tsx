import React from 'react';
import { useCallback, useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import EditorToolbar from './EditorToolbar';
import { Box } from '@mui/material';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  onMount?: (editor: any) => void;
  bulletList?: boolean;
  type?: 'body' | 'slide' | 'bullet';
}

const TiptapEditor = ({ content, onChange, placeholder = 'Start typing...', editable = true, onMount, bulletList, ...rest }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
        },
        orderedList: {},
        blockquote: {},
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: bulletList && !content ? '<ul><li></li></ul>' : content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
        placeholder,
      },
    },
    immediatelyRender: false
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  useEffect(() => {
    if (editor && onMount) {
      onMount(editor);
    }
  }, [editor, onMount]);

  const addImage = useCallback((url: string, alt: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url, alt }).run();
    }
  }, [editor]);

  return (
    <Box className="tiptap-editor-container" {...rest}>
      {editor && <EditorToolbar editor={editor} />}
      <Box className="tiptap-editor">
        <EditorContent editor={editor} />
      </Box>
      <style jsx global>{`
        .tiptap-editor-container {
          display: flex;
          flex-direction: column;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          overflow: hidden;
        }
        .tiptap-editor {
          position: relative;
          width: 100%;
          min-height: 100px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
        }
        .tiptap-editor:focus-within {
          border-color: #4f46e5;
          ring: 2px;
          ring-color: #4f46e5;
        }
        .tiptap-editor .ProseMirror {
          font-size: 16px !important;
        }
        .tiptap-editor .ProseMirror h1 {
          font-size: 20px !important;
        }
        .tiptap-editor .ProseMirror h2 {
          font-size: 18px !important;
        }
        .tiptap-editor .ProseMirror h3 {
          font-size: 16px !important;
        }
        .ProseMirror {
          > * + * {
            margin-top: 0.75em;
          }
          &:focus {
            outline: none;
          }
 HEAD
          ul, ol {
            padding-left: 1.5em;
          }
          blockquote {
            border-left: 3px solid #e2e8f0;
            padding-left: 1em;
            margin-left: 0;
            font-style: italic;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          h1 {
            font-size: 2em;
            margin-bottom: 0.5em;
          }
          h2 {
            font-size: 1.5em;
            margin-bottom: 0.4em;
          }
          h3 {
            font-size: 1.17em;
            margin-bottom: 0.3em;
          }
          &[placeholder]:empty:before {
            content: attr(placeholder);
            color: #9ca3af;
            pointer-events: none;
            float: left;
            height: 0;
          }
        }
      `}</style>
    </Box>
  );
};

export default TiptapEditor;
