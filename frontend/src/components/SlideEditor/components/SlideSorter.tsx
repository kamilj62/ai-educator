import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import SortableSlide from './SortableSlide';
import { Slide } from '../types';

// Static version without drag and drop
const StaticList = ({ slides, activeSlideId, onSlideSelect, onSlideDelete }: {
  slides: Slide[];
  activeSlideId?: string;
  onSlideSelect: (slideId: string) => void;
  onSlideDelete: (slideId: string) => void;
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {slides.map((slide, index) => (
      <Box key={slide.id}>
        <SortableSlide
          slide={slide}
          index={index}
          isActive={slide.id === activeSlideId}
          onClick={() => onSlideSelect(slide.id)}
          onDelete={() => onSlideDelete(slide.id)}
        />
      </Box>
    ))}
  </Box>
);

interface SlideSorterProps {
  slides: Slide[];
  activeSlideId?: string;
  onSlidesReorder: (newSlides: Slide[]) => void;
  onSlideSelect: (slideId: string) => void;
  onSlideDelete: (slideId: string) => void;
}

// Dynamic import of the draggable version
const DraggableList = dynamic<SlideSorterProps>(() => import('./SlideSorterDraggable'), {
  ssr: false,
});

const SlideSorter: React.FC<SlideSorterProps> = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <StaticList {...props} />;
  }

  return <DraggableList {...props} />;
};

export default SlideSorter;
