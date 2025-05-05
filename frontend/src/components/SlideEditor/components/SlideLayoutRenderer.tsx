import React from 'react';
import TitleBulletsLayout from '../layouts/TitleBulletsLayout';
import TitleBodyLayout from '../layouts/TitleBodyLayout';
import TitleImageLayout from '../layouts/TitleImageLayout';
import TwoColumnLayout from '../layouts/TwoColumnLayout';
import TitleOnlyLayout from '../layouts/TitleOnlyLayout';
import type { Slide, SlideLayout, SlideImage, ImageService } from '../types';

interface SlideLayoutRendererProps {
  slide: Slide;
  onChange?: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
  preview?: boolean;
  slides?: Slide[];
}

const SlideLayoutRenderer: React.FC<SlideLayoutRendererProps> = ({ slide, onChange = () => {}, onImageUpload, onImageGenerate, preview, slides }) => {
  switch (slide.layout) {
    case 'title-only':
      return <TitleOnlyLayout slide={slide} onChange={onChange} />;
    case 'title-bullets': {
      // Find the index of the current slide in the slides array if available
      let slideIndex = 0;
      if (Array.isArray(slides)) {
        slideIndex = slides.findIndex(s => s.id === slide.id);
      }
      return <TitleBulletsLayout slide={slide} index={slideIndex} onChange={onChange} />;
    }
    case 'title-body':
      return <TitleBodyLayout slide={slide} onChange={onChange} />;
    case 'title-image':
      return <TitleImageLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
    case 'title-body-image':
      return <TitleBodyLayout slide={slide} onChange={onChange} />;
    case 'two-column':
      return <TwoColumnLayout slide={slide} onChange={onChange} preview={preview} />;
    default:
      return <TitleOnlyLayout slide={slide} onChange={onChange} />;
  }
};

export default SlideLayoutRenderer;
