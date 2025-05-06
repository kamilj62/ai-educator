import React from 'react';
import TitleBulletsLayout from '../layouts/TitleBulletsLayout';
import TitleBodyLayout from '../layouts/TitleBodyLayout';
import TitleImageLayout from '../layouts/TitleImageLayout';
import TwoColumnLayout from '../layouts/TwoColumnLayout';
<<<<<<< HEAD
import TitleOnlyLayout from '../layouts/TitleOnlyLayout';
import type { Slide, SlideLayout, SlideImage, ImageService } from '../types';
=======
import type { Slide, SlideLayout } from '../types';
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)

interface SlideLayoutRendererProps {
  slide: Slide;
  onChange?: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
<<<<<<< HEAD
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
  preview?: boolean;
  slides?: Slide[];
=======
  onImageGenerate?: (prompt: string, service?: string) => Promise<string>;
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)
}

const SlideLayoutRenderer: React.FC<SlideLayoutRendererProps> = ({ slide, onChange = () => {}, onImageUpload, onImageGenerate, preview, slides }) => {
  switch (slide.layout) {
<<<<<<< HEAD
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
=======
    case 'title-bullets':
      return <TitleBulletsLayout slide={slide} onChange={onChange} />;
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)
    case 'title-body':
      return <TitleBodyLayout slide={slide} onChange={onChange} />;
    case 'title-image':
      return <TitleImageLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
    case 'title-body-image':
      return <TitleBodyLayout slide={slide} onChange={onChange} />;
    case 'two-column':
<<<<<<< HEAD
      return <TwoColumnLayout slide={slide} onChange={onChange} preview={preview} />;
    default:
      return <TitleOnlyLayout slide={slide} onChange={onChange} />;
=======
      return <TwoColumnLayout slide={slide} onChange={onChange} />;
    default:
      return <TitleBulletsLayout slide={slide} onChange={onChange} />;
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)
  }
};

export default SlideLayoutRenderer;
