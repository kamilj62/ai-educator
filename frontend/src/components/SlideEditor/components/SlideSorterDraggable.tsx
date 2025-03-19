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
}

const SlideSorterDraggable: React.FC<SlideSorterDraggableProps> = ({
  slides,
  activeSlideId,
  onSlidesReorder,
  onSlideSelect,
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

  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {slides.map((slide, index) => (
          <Box key={slide.id}>
            <SortableSlide
              slide={slide}
              index={index}
              isActive={slide.id === activeSlideId}
              onClick={() => onSlideSelect(slide.id)}
            />
          </Box>
        ))}
      </Box>
    );
  }

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
              minHeight: '100%'
            }}
          >
            {slides.map((slide, index) => (
              <Draggable key={slide.id} draggableId={slide.id} index={index}>
                {(dragProvided, snapshot) => (
                  <Box
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    sx={{
                      position: 'relative',
                    }}
                  >
                    <SortableSlide
                      slide={slide}
                      index={index}
                      isDragging={snapshot.isDragging}
                      isActive={slide.id === activeSlideId}
                      onClick={() => onSlideSelect(slide.id)}
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
  );
};

export default SlideSorterDraggable;
