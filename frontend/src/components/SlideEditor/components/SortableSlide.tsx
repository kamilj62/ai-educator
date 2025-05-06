import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Slide } from '../types';
<<<<<<< HEAD
import SlideLayoutRenderer from './SlideLayoutRenderer';
=======
import Image from 'next/image';
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)

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
<<<<<<< HEAD
        {/* Only show the title for all slides in the sorter */}
        {index === 0 ? (
          <Box sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.2rem', color: '#222', py: 2 }}>
            {slide.content.title}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#222', py: 2 }}>
            {slide.content.title}
=======
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
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
              bgcolor: 'action.hover',
            }}
          >
            <Image
              src={slide.content.image.url}
              alt={slide.content.image.alt || ''}
              layout="fill"
              objectFit="cover"
              style={{ borderRadius: '4px' }}
              sizes="(max-width: 600px) 100vw, 332px"
              priority={index === 0}
            />
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
          </Box>
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
          boxShadow: 4,
          background: 'rgba(33, 150, 243, 0.08)', // blue highlight on hover
        },
        ...(isActive && {
          borderColor: 'primary.main',
          borderWidth: 2,
          borderStyle: 'solid',
          background: 'rgba(33, 150, 243, 0.16)', // blue background for active
        }),
        background: 'rgba(33, 150, 243, 0.06)', // default card background (light blue)
      }}
    >
      <CardContent sx={{ p: 0 }}>{renderThumbnail()}</CardContent>
    </Card>
  );
};

export default SortableSlide;
