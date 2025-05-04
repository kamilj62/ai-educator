import React, { memo, useCallback, useState } from 'react';
import { Box } from '@mui/material';
import SortableSlide from './SortableSlide';
import { Slide } from '../types';

const grid = 8;

const getItemStyle = (isDragging: boolean) => ({
  userSelect: 'none' as const,
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,
  background: isDragging ? '#e3f2fd' : 'white',
  border: isDragging ? '2px solid #1976d2' : '1px solid #e0e0e0',
  boxShadow: isDragging ? '0 4px 24px rgba(25, 118, 210, 0.12)' : 'none',
  borderRadius: '6px',
  cursor: isDragging ? 'grabbing' : 'grab',
  opacity: isDragging ? 0.85 : 1,
  transition: 'background 0.2s, border 0.2s, box-shadow 0.2s, opacity 0.2s',
});

interface DraggableItemProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragOver: (index: number) => void;
}

const DraggableItem = memo(({
  slide,
  index,
  isActive,
  onSelect,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver
}: DraggableItemProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={() => { onDragStart(index); setIsDragging(true); }}
      onDragEnd={() => { onDragEnd(); setIsDragging(false); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      style={getItemStyle(isDragging)}
    >
      <SortableSlide
        slide={slide}
        index={index}
        isActive={isActive}
        onClick={() => onSelect(slide.id)}
        onDelete={() => onDelete(slide.id)}
      />
    </div>
  );
});

DraggableItem.displayName = 'DraggableItem';

interface SlideSorterProps {
  slides: Slide[];
  activeSlideId?: string;
  onSlidesReorder: (newSlides: Slide[]) => void;
  onSlideSelect: (slideId: string) => void;
  onSlideDelete: (slideId: string) => void;
}

const SlideSorter: React.FC<SlideSorterProps> = ({
  slides,
  activeSlideId,
  onSlidesReorder,
  onSlideSelect,
  onSlideDelete
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  const handleDragOver = useCallback((targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;

    const newSlides = [...slides];
    const [draggedSlide] = newSlides.splice(dragIndex, 1);
    newSlides.splice(targetIndex, 0, draggedSlide);
    
    onSlidesReorder(newSlides);
    setDragIndex(targetIndex);
  }, [dragIndex, slides, onSlidesReorder]);

  if (!Array.isArray(slides) || slides.length === 0) {
    return null;
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Box 
        sx={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          p: 2
        }}
      >
        <Box sx={{ width: 332 }}>
          {slides.map((slide, index) => (
            <DraggableItem
              key={slide.id}
              slide={slide}
              index={index}
              isActive={slide.id === activeSlideId}
              onSelect={onSlideSelect}
              onDelete={onSlideDelete}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

SlideSorter.displayName = 'SlideSorter';

export default memo(SlideSorter);
