import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useCallback } from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

const TiptapEditor = ({ content, onChange, placeholder = 'Start typing...', editable = true }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  const addImage = useCallback((url: string, alt: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url, alt }).run();
    }
  }, [editor]);

  return (
    <div className="tiptap-editor">
      <EditorContent editor={editor} />
      <style jsx global>{`
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
        .ProseMirror {
          > * + * {
            margin-top: 0.75em;
          }
          &:focus {
            outline: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor;
