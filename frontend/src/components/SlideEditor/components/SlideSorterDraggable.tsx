import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import SortableSlide from './SortableSlide';
import { Slide } from '../types';

interface SlideSorterDraggableProps {
  slides: Slide[];
  activeSlideId?: string;
  onSlidesReorder: (newSlides: Slide[]) => void;
  onSlideSelect: (slideId: string) => void;
  onSlideDelete: (slideId: string) => void;
}

const DROPPABLE_ID = 'slide-list';

const getItemStyle = (isDragging: boolean, draggableStyle: any) => ({
  userSelect: 'none' as const,
  padding: '16px',
  marginBottom: '16px',
  width: '300px',
  background: isDragging ? 'rgba(63, 81, 181, 0.08)' : 'transparent',
  borderRadius: '8px',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  ...draggableStyle
});

const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? 'rgba(63, 81, 181, 0.04)' : 'transparent',
  padding: '16px',
  minHeight: '200px',
  width: '332px' // 300px + 32px padding
});

const SlideSorterDraggable: React.FC<SlideSorterDraggableProps> = ({
  slides,
  activeSlideId,
  onSlidesReorder,
  onSlideSelect,
  onSlideDelete,
}) => {
  const [internalSlides, setInternalSlides] = useState<Slide[]>(slides);

  useEffect(() => {
    if (slides.length !== internalSlides.length) {
      setInternalSlides(slides);
    }
  }, [slides, internalSlides.length]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.droppableId !== DROPPABLE_ID) return;

    const reorderedSlides = Array.from(internalSlides);
    const [removed] = reorderedSlides.splice(result.source.index, 1);
    reorderedSlides.splice(result.destination.index, 0, removed);

    setInternalSlides(reorderedSlides);
    onSlidesReorder(reorderedSlides);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={DROPPABLE_ID}>
          {(provided, snapshot) => (
            <Box
              {...provided.droppableProps}
              ref={provided.innerRef}
              sx={{
                ...getListStyle(snapshot.isDraggingOver),
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
              }}
            >
              {internalSlides.map((slide, index) => (
                <Draggable 
                  key={slide.id} 
                  draggableId={`slide-${slide.id}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                    >
                      <SortableSlide
                        slide={slide}
                        index={index}
                        isActive={slide.id === activeSlideId}
                        onClick={() => onSlideSelect(slide.id)}
                        onDelete={() => onSlideDelete(slide.id)}
                      />
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
    </Box>
  );
};

export default SlideSorterDraggable;
