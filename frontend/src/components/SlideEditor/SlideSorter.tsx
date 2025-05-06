<<<<<<< HEAD
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
=======
import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, closestCenter, KeyboardSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex(slide => slide.id === active.id);
      const newIndex = slides.findIndex(slide => slide.id === over.id);

      const newSlides = [...slides];
      const [movedSlide] = newSlides.splice(oldIndex, 1);
      newSlides.splice(newIndex, 0, movedSlide);

      onSlidesReorder(newSlides);
    }

    setActiveId(null);
  };

  return (
    <SorterContainer>
      <DndContext
        sensors={sensors}
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
      </DndContext>
    </SorterContainer>
  );
};

export default SlideSorter;
