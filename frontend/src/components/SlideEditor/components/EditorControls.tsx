import React from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import PresentationIcon from '@mui/icons-material/Slideshow';
import LayoutSwitcher from './LayoutSwitcher';
import { Slide, BackendSlideLayout } from '../types';
import { convertLayoutToFrontend, convertLayoutToBackend } from './utils';

interface EditorControlsProps {
  slide: Slide;
  onLayoutChange: (slideId: string, newLayout: BackendSlideLayout) => void;
  onAddSlide: (layout?: BackendSlideLayout) => void;
  onDuplicateSlide?: () => void;
  onDeleteSlide?: () => void;
  onStartPresentation?: () => void;
}

const EditorControls: React.FC<EditorControlsProps> = ({
  slide,
  onLayoutChange,
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
      <LayoutSwitcher
        layout={convertLayoutToFrontend(slide.layout)}
        onLayoutChange={(newLayout) =>
          onLayoutChange(slide.id, convertLayoutToBackend(newLayout))
        }
      />

      <Box sx={{ flex: 1 }} />

      <Tooltip title="Add Slide">
        <IconButton onClick={() => onAddSlide()}>
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
