import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Slide } from '../types';
import SlideLayoutRenderer from './SlideLayoutRenderer';

interface SortableSlideProps {
  slide: Slide;
  isDragging?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  index?: number;
}

const SortableSlide: React.FC<SortableSlideProps> = ({
  slide,
  isDragging = false,
  isActive = false,
  onClick,
  onDelete,
  index = 0,
}) => {
  const renderThumbnail = () => {
    return (
      <Box sx={{ p: 1.5, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Slide {index + 1}
          </Typography>
          {onDelete && (
            <Tooltip title="Delete slide">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                sx={{ ml: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {/* Only show the title for slide 1 (index 0) in the sorter, otherwise show full preview */}
        {index === 0 ? (
          <Box sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.2rem', color: '#222', py: 2 }}>
            {slide.content.title}
          </Box>
        ) : (
          <SlideLayoutRenderer slide={slide} preview />
        )}
      </Box>
    );
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: isDragging ? 'scale(1.02)' : 'none',
        '&:hover': {
          boxShadow: 2,
        },
        ...(isActive && {
          borderColor: 'primary.main',
          borderWidth: 2,
          borderStyle: 'solid',
        }),
      }}
    >
      <CardContent sx={{ p: 0 }}>{renderThumbnail()}</CardContent>
    </Card>
  );
};

export default SortableSlide;
