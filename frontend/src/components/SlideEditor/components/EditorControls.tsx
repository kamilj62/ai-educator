import React from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface EditorControlsProps {
  onSave: () => void;
  onCancel: () => void;
  onAddSlide?: () => void;
  onDuplicateSlide?: () => void;
  onDeleteSlide?: () => void;
  onStartPresentation?: () => void;
}

const EditorControls: React.FC<EditorControlsProps> = ({ 
  onSave, 
  onCancel, 
  onAddSlide, 
  onDuplicateSlide, 
  onDeleteSlide, 
  onStartPresentation 
}) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
      <Box>
        {onAddSlide && (
          <Tooltip title="Add Slide">
            <IconButton 
              onClick={onAddSlide} 
              size="large"
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                mr: 1,
                color: 'inherit'
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
        {onDuplicateSlide && (
          <Tooltip title="Duplicate Slide">
            <IconButton 
              onClick={onDuplicateSlide} 
              size="large"
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                mr: 1
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onDeleteSlide && (
          <Tooltip title="Delete Slide">
            <IconButton 
              onClick={onDeleteSlide} 
              size="large"
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                mr: 1
              }}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box display="flex" gap={2}>
        <Button onClick={onCancel}>Cancel</Button>
        {onStartPresentation && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onStartPresentation}
            startIcon={<PlayArrowIcon />}
          >
            Start
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default EditorControls;
