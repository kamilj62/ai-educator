import React from 'react';
import { memo } from 'react';
import { Box } from '@mui/material';
import SortableSlide from './SortableSlide';
import { Slide } from '../../types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const [isDragging, setIsDragging] = React.useState(false);

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

function SortableSlideDnD({
  slide,
  index,
  isActive,
  onSelect,
  onDelete,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
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
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.8 : 1,
    background: isDragging ? '#e3f2fd' : 'white',
    border: isDragging ? '2px solid #1976d2' : '1px solid #e0e0e0',
    borderRadius: '6px',
    marginBottom: 8,
    cursor: isDragging ? 'grabbing' : 'grab',
    boxShadow: isDragging ? '0 4px 24px rgba(25, 118, 210, 0.12)' : 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SortableSlide
        slide={slide}
        index={index}
        isActive={isActive}
        onClick={() => onSelect(slide.id)}
        onDelete={() => onDelete(slide.id)}
      />
    </div>
  );
}

const SlideSorter: React.FC<SlideSorterProps> = memo(({
  slides,
  activeSlideId,
  onSlidesReorder,
  onSlideSelect,
  onSlideDelete
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = slides.findIndex(slide => slide.id === active.id);
      const newIndex = slides.findIndex(slide => slide.id === over.id);
      const newSlides = arrayMove(slides, oldIndex, newIndex);
      onSlidesReorder(newSlides);
    }
  };

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
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <Box sx={{ width: 332 }}>
              {slides.map((slide, index) => (
                <SortableSlideDnD
                  key={slide.id}
                  slide={slide}
                  index={index}
                  isActive={slide.id === activeSlideId}
                  onSelect={onSlideSelect}
                  onDelete={onSlideDelete}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      </Box>
    </Box>
  );
});

SlideSorter.displayName = 'SlideSorter';

export default SlideSorter;
