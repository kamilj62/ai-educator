import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box } from '@mui/material';

interface TiptapSlideEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  type: 'slide' | 'bullet' | 'body';
}

export const TiptapSlideEditor: React.FC<TiptapSlideEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  type
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    immediatelyRender: false, // Fix SSR hydration issue
  });

  if (!editor) {
    return null;
  }

  const getEditorStyles = () => {
    switch (type) {
      case 'slide':
        return {
          fontSize: '1.5rem',
          fontWeight: 600,
          minHeight: '40px',
          width: '100%',
        };
      case 'bullet':
        return {
          fontSize: '1rem',
          minHeight: '30px',
          width: '100%',
          pl: 2,
          '&:before': {
            content: '"•"',
            position: 'absolute',
            left: '0.5rem',
          },
        };
      case 'body':
        return {
          fontSize: '1rem',
          minHeight: '100px',
          width: '100%',
        };
      default:
        return {};
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
        '&:focus-within': {
          borderColor: 'primary.main',
        },
        ...getEditorStyles(),
      }}
    >
      <EditorContent editor={editor} />
      {!content && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: '1rem',
            color: 'text.disabled',
            pointerEvents: 'none',
          }}
        >
          {placeholder}
        </Box>
      )}
    </Box>
  );
};
