<<<<<<< HEAD
import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, closestCenter, KeyboardSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
=======
<<<<<<< HEAD
import React from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Box, styled, Grid } from '@mui/material';
import SortableSlide from './components/SortableSlide';
import { Slide } from './types';

interface SlideSorterProps {
  slides: Slide[];
  onSlidesReorder: (newSlides: Slide[]) => void;
  onSlideSelect?: (slideId: string) => void;
  activeSlideId?: string;
}

const SorterContainer = styled(Box)(({ theme }) => ({
  width: '280px',
  height: '100%',
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const SortableItem = ({ slide, onClick, isActive }: { slide: Slide; onClick?: () => void; isActive?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SortableSlide
        slide={slide}
        isDragging={isDragging}
        onClick={onClick}
        isActive={isActive}
      />
    </div>
  );
};

const SlideSorter: React.FC<SlideSorterProps> = ({
  slides,
  onSlidesReorder,
  onSlideSelect,
  activeSlideId,
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const activeSlide = activeId ? slides.find(slide => slide.id === activeId) : null;

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

=======
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

>>>>>>> dd7ecbd (added imagen images)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
<<<<<<< HEAD
      const oldIndex = slides.findIndex(slide => slide.id === active.id);
      const newIndex = slides.findIndex(slide => slide.id === over.id);

      const newSlides = [...slides];
      const [movedSlide] = newSlides.splice(oldIndex, 1);
      newSlides.splice(newIndex, 0, movedSlide);

      onSlidesReorder(newSlides);
    }

    setActiveId(null);
=======
      const oldIndex = slides.findIndex((slide) => slide.id === active.id);
      const newIndex = slides.findIndex((slide) => slide.id === over.id);
      
      onSlidesReorder(arrayMove(slides, oldIndex, newIndex));
    }
>>>>>>> dd7ecbd (added imagen images)
  };

  return (
    <SorterContainer>
      <DndContext
        sensors={sensors}
<<<<<<< HEAD
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={slides.map(slide => slide.id)} strategy={verticalListSortingStrategy}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {slides.map((slide) => (
              <SortableItem
                key={slide.id}
                slide={slide}
                onClick={onSlideSelect ? () => onSlideSelect(slide.id) : undefined}
                isActive={slide.id === activeSlideId}
              />
            ))}
          </Box>
        </SortableContext>

        <DragOverlay>
          {activeSlide ? (
            <Box sx={{ width: '100%', maxWidth: 280 }}>
              <SortableSlide slide={activeSlide} isDragging />
            </Box>
          ) : null}
        </DragOverlay>
=======
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
>>>>>>> dd7ecbd (added imagen images)
      </DndContext>
    </SorterContainer>
  );
};

export default SlideSorter;
