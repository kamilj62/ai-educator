import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Slide } from '../types';

interface SortableSlideProps {
  slide: Slide;
  isDragging?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  index?: number;
}

const SortableSlide: React.FC<SortableSlideProps> = ({
  slide,
  isDragging = false,
  isActive = false,
  onClick,
  index = 0,
}) => {
  const renderThumbnail = () => {
    return (
      <Box sx={{ p: 1.5 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 0.5 }}
        >
          Slide {index + 1}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
            fontWeight: isActive ? 500 : 400,
            color: isActive ? 'primary.main' : 'text.primary',
          }}
        >
          {slide.content.title || 'Untitled Slide'}
        </Typography>

        {slide.content.image?.url && (
          <Box
            sx={{
              mt: 1,
              width: '100%',
              height: '60px',
              overflow: 'hidden',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <img 
              src={slide.content.image.url} 
              alt={slide.content.image.alt || 'Slide thumbnail'} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Card
      sx={{
        height: '100px',
        cursor: 'pointer',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s ease-in-out',
        border: isActive ? '2px solid' : '1px solid',
        borderColor: isActive ? 'primary.main' : 'divider',
        backgroundColor: isActive ? 'action.selected' : 'background.paper',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: isActive ? 'action.selected' : 'action.hover',
          transform: isDragging ? 'none' : 'translateY(-2px)',
        },
      }}
      onClick={onClick}
      elevation={isActive ? 2 : 1}
    >
      <CardContent sx={{ height: '100%', p: '0 !important' }}>
        {renderThumbnail()}
      </CardContent>
    </Card>
  );
};

export default SortableSlide;
