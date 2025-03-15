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
