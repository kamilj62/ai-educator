import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Slide } from '../types';
import Image from 'next/image';

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
                sx={{ 
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 1 },
                  '.MuiCard-root:hover &': { opacity: 0.7 }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
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
