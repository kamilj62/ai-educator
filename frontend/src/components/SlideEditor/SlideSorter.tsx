import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSlide } from './components/SortableSlide';
import { Slide } from './types';
import { Box, styled } from '@mui/material';

const SorterContainer = styled(Box)(({ theme }) => ({
  width: '280px',
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
}));

interface SlideSorterProps {
  slides: Slide[];
  activeSlideId?: string;
  onSlidesReorder: (newSlides: Slide[]) => void;
  onSlideSelect: (slideId: string) => void;
}

const SlideSorter = ({
  slides,
  activeSlideId,
  onSlidesReorder,
  onSlideSelect,
}: SlideSorterProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((slide) => slide.id === active.id);
      const newIndex = slides.findIndex((slide) => slide.id === over.id);
      
      onSlidesReorder(arrayMove(slides, oldIndex, newIndex));
    }
  };

  return (
    <SorterContainer>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slides.map((slide) => ({ id: slide.id }))}
          strategy={verticalListSortingStrategy}
        >
          {slides.map((slide) => (
            <SortableSlide
              key={slide.id}
              slide={slide}
              isActive={slide.id === activeSlideId}
              onClick={() => onSlideSelect(slide.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </SorterContainer>
  );
};

export default SlideSorter;
