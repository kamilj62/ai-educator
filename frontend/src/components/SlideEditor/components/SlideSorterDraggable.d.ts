import { FC } from 'react';
import { Slide } from '../types';

interface SlideSorterDraggableProps {
  slides: Slide[];
  activeSlideId?: string;
  onSlidesReorder: (newSlides: Slide[]) => void;
  onSlideSelect: (slideId: string) => void;
  onSlideDelete: (slideId: string) => void;
}

declare const SlideSorterDraggable: FC<SlideSorterDraggableProps>;
export default SlideSorterDraggable;
