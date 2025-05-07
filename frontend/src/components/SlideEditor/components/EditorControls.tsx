import React from 'react';
import { Box, Button } from '@mui/material';

interface EditorControlsProps {
  onSave: () => void;
  onCancel: () => void;
  onAddSlide?: () => void;
  onDuplicateSlide?: () => void;
  onDeleteSlide?: () => void;
  onStartPresentation?: () => void;
}

const EditorControls: React.FC<EditorControlsProps> = ({ onSave, onCancel, onAddSlide, onDuplicateSlide, onDeleteSlide, onStartPresentation }) => {
  return (
    <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant="contained" color="primary" onClick={onSave}>
        Save
      </Button>
      {onAddSlide && <Button onClick={onAddSlide}>Add Slide</Button>}
      {onDuplicateSlide && <Button onClick={onDuplicateSlide}>Duplicate Slide</Button>}
      {onDeleteSlide && <Button onClick={onDeleteSlide}>Delete Slide</Button>}
      {onStartPresentation && <Button onClick={onStartPresentation}>Start Presentation</Button>}
    </Box>
  );
};

export default EditorControls;
