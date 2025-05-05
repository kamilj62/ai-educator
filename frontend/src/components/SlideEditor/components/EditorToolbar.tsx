import React from 'react';
import { Box, IconButton, Tooltip, Divider } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
} from '@mui/icons-material';
import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor | null;
  onImageClick?: () => void;
}

type Tool = {
  icon: JSX.Element;
  title: string;
  action: () => void;
  isActive: () => boolean;
} | {
  type: 'divider';
};

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, onImageClick }) => {
  if (!editor) {
    return null;
  }

  const tools: Tool[] = [
    {
      icon: <FormatBold />,
      title: 'Bold',
      action: () => editor?.chain().focus().toggleBold().run(),
      isActive: () => editor?.isActive('bold') ?? false,
    },
    {
      icon: <FormatItalic />,
      title: 'Italic',
      action: () => editor?.chain().focus().toggleItalic().run(),
      isActive: () => editor?.isActive('italic') ?? false,
    },
    { type: 'divider' },
    {
      icon: <FormatListBulleted />,
      title: 'Bullet List',
      action: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: () => editor?.isActive('bulletList') ?? false,
    },
    {
      icon: <FormatListNumbered />,
      title: 'Numbered List',
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: () => editor?.isActive('orderedList') ?? false,
    },
    { type: 'divider' },
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 0.5, 
      p: 1, 
      backgroundColor: 'background.paper',
      borderBottom: 1,
      borderColor: 'divider'
    }}>
      {tools.map((tool, index) => 
        'type' in tool ? (
          <Divider orientation="vertical" flexItem key={`divider-${index}`} />
        ) : (
          <Tooltip key={tool.title} title={tool.title}>
            <span>
              <IconButton
                size="small"
                onClick={tool.action}
                color={tool.isActive() ? 'primary' : 'default'}
                disabled={!editor.isEditable}
              >
                {tool.icon}
              </IconButton>
            </span>
          </Tooltip>
        )
      )}
    </Box>
  );
};

export default EditorToolbar;
