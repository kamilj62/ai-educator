import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import PresentationIcon from '@mui/icons-material/Slideshow';

import LayoutSwitcher from './LayoutSwitcher';
import { Slide } from '../types';
import { convertLayoutToFrontend, convertLayoutToBackend } from '../utils';

interface EditorControlsProps {
  onAddSlide: () => void;
  onDuplicateSlide?: () => void;
  onDeleteSlide?: () => void;
  onStartPresentation?: () => void;
}

const EditorControls: React.FC<EditorControlsProps> = ({
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onStartPresentation,
}) => {
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      p: 1,
      borderBottom: 1,
      borderColor: 'divider',
    }}>
      <Box sx={{ flex: 1 }} />
      <Tooltip title="Add Slide">
        <IconButton onClick={onAddSlide} sx={{ color: 'white', bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}>
          <AddIcon />
        </IconButton>
      </Tooltip>
      {onDuplicateSlide && (
        <Tooltip title="Duplicate Slide">
          <IconButton onClick={onDuplicateSlide}>
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
      )}
      {onDeleteSlide && (
        <Tooltip title="Delete Slide">
          <IconButton onClick={onDeleteSlide}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
      {onStartPresentation && (
        <Tooltip title="Start Presentation">
          <IconButton onClick={onStartPresentation}>
            <PresentationIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default EditorControls;
