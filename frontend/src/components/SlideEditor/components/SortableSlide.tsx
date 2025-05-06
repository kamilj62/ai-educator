<<<<<<< HEAD
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
        {/* Only show the title for all slides in the sorter */}
        {index === 0 ? (
          <Box sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.2rem', color: '#222', py: 2 }}>
            {slide.content.title}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#222', py: 2 }}>
            {slide.content.title}
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
=======
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Paper, Typography, styled } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Slide } from './types';

const SlidePreview = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: isActive ? theme.palette.primary.light : theme.palette.background.paper,
  '&:hover': {
    backgroundColor: isActive ? theme.palette.primary.light : theme.palette.grey[100],
  },
}));

const PreviewContent = styled(Box)({
  flex: 1,
  overflow: 'hidden',
});

interface SortableSlideProps {
  slide: Slide;
  isActive?: boolean;
  onClick: () => void;
}

export const SortableSlide = ({ slide, isActive, onClick }: SortableSlideProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPreviewText = () => {
    const title = slide.content.title?.replace(/<[^>]*>/g, '') || 'Untitled Slide';
    return title.length > 30 ? `${title.substring(0, 30)}...` : title;
  };

  return (
    <SlidePreview
      ref={setNodeRef}
      style={style}
      isActive={isActive}
      onClick={onClick}
      elevation={isDragging ? 4 : 1}
    >
      <Box {...attributes} {...listeners}>
        <DragIndicatorIcon color="action" />
      </Box>
      <PreviewContent>
        <Typography variant="body2" noWrap>
          {getPreviewText()}
        </Typography>
      </PreviewContent>
    </SlidePreview>
  );
};
>>>>>>> dd7ecbd (added imagen images)
