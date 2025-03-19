import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import SortableSlide from './SortableSlide';
import { Slide } from '../types';

interface SlideSorterDraggableProps {
  slides: Slide[];
  activeSlideId?: string;
  onSlidesReorder: (newSlides: Slide[]) => void;
  onSlideSelect: (slideId: string) => void;
  onSlideDelete: (slideId: string) => void;
}

const SlideSorterDraggable: React.FC<SlideSorterDraggableProps> = ({
  slides,
  activeSlideId,
  onSlidesReorder,
  onSlideSelect,
  onSlideDelete,
}) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure component is mounted before enabling drag and drop
    setIsReady(true);
  }, []);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(slides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onSlidesReorder(items);
  };

  if (!isReady) return null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="slides">
        {(provided) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              p: 2,
              height: '100%',
              overflowY: 'auto'
            }}
          >
            {slides.map((slide, index) => (
              <Draggable key={slide.id} draggableId={slide.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <SortableSlide
                      slide={slide}
                      index={index}
                      isDragging={snapshot.isDragging}
                      isActive={slide.id === activeSlideId}
                      onClick={() => onSlideSelect(slide.id)}
                      onDelete={() => onSlideDelete(slide.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default SlideSorterDraggable;
