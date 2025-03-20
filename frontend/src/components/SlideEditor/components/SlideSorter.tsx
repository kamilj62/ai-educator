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
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
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
const DraggableList = dynamic<SlideSorterProps>(
  () => import('./SlideSorterDraggable'),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ opacity: 0.7 }}>
        <StaticList
          slides={[]}
          onSlideSelect={() => {}}
          onSlideDelete={() => {}}
        />
      </Box>
    ),
  }
);

const SlideSorter: React.FC<SlideSorterProps> = (props) => {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBrowser(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isBrowser) {
    return (
      <Box sx={{ height: '100%', overflowY: 'auto' }}>
        <StaticList {...props} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <DraggableList {...props} />
    </Box>
  );
};

export default SlideSorter;
