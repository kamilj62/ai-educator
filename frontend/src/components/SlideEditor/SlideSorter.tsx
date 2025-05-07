import React from 'react';
import { Slide } from '../types';
import SortableSlide from './components/SortableSlide';

interface SlideSorterProps {
  slides: Slide[];
  activeSlideId: string | null;
  onSlidesReorder: (slides: Slide[]) => void;
  onDelete: (index: number) => void;
  onSlideSelect: (id: string) => void;
}

const SlideSorter: React.FC<SlideSorterProps> = ({ slides, activeSlideId, onSlidesReorder, onDelete, onSlideSelect }) => {
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {slides.map((slide, idx) => (
        <li key={slide.id}>
          <SortableSlide
            slide={slide}
            index={idx}
            isActive={slide.id === activeSlideId}
            onClick={() => onSlideSelect(slide.id)}
            onDelete={() => onDelete(idx)}
          />
        </li>
      ))}
    </ul>
  );
};

export default SlideSorter;
