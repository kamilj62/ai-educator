import React from 'react';
import { Card, CardContent, Typography, IconButton } from '@mui/material';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import DeleteIcon from '@mui/icons-material/Delete';
import { Slide } from '../../types';

interface SortableSlideProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const SortableSlide: React.FC<SortableSlideProps> = ({ slide, index, isActive, onClick, onDelete }) => {
  return (
    <Card
      onClick={onClick}
      sx={{ display: 'flex', alignItems: 'center', mb: 1, border: isActive ? '2px solid #6366f1' : '1px solid #e0e0e0', cursor: 'pointer', boxShadow: isActive ? 4 : 1 }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Typography variant="body1">{slide.content.title || `Slide ${index + 1}`}</Typography>
      </CardContent>
      <IconButton>
        <DragHandleIcon />
      </IconButton>
      <IconButton onClick={onDelete} color="error">
        <DeleteIcon />
      </IconButton>
    </Card>
  );
};

export default SortableSlide;
