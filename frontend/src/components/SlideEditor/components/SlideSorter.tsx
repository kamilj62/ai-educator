import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import SortableSlide from './SortableSlide';
import { Slide } from '../types';

// Disable SSR for react-beautiful-dnd
const DragDropContextNoSSR = dynamic(
  () => import('react-beautiful-dnd').then((mod) => mod.DragDropContext),
  { ssr: false }
);

const DroppableNoSSR = dynamic(
  () => import('react-beautiful-dnd').then((mod) => mod.Droppable),
  { ssr: false }
);

const DraggableNoSSR = dynamic(
  () => import('react-beautiful-dnd').then((mod) => mod.Draggable),
  { ssr: false }
);

interface SlideSorterProps {
  slides: Slide[];
  activeSlideId?: string;
  onSlidesReorder: (newSlides: Slide[]) => void;
  onSlideSelect: (slideId: string) => void;
}

const SlideSorter: React.FC<SlideSorterProps> = ({
  slides,
  activeSlideId,
  onSlidesReorder,
  onSlideSelect,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(slides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onSlidesReorder(items);
  };

  if (!isMounted) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: 'background.paper',
          overflowY: 'auto',
          p: 2,
        }}
      >
        {slides.map((slide, index) => (
          <Box key={slide.id} sx={{ mb: 2 }}>
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
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: 'background.paper',
        overflowY: 'auto',
        p: 2,
      }}
    >
      <DragDropContextNoSSR onDragEnd={handleDragEnd}>
        <DroppableNoSSR droppableId="slides">
          {(provided: any) => (
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
                <DraggableNoSSR key={slide.id} draggableId={slide.id} index={index}>
                  {(provided: any, snapshot: any) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{
                        position: 'relative',
                        '&:hover': {
                          '& .drag-handle': {
                            opacity: 1,
                          },
                        },
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
                </DraggableNoSSR>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </DroppableNoSSR>
      </DragDropContextNoSSR>
    </Box>
  );
};

export default SlideSorter;
