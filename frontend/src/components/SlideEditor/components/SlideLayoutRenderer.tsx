import React from 'react';
import TitleBulletsLayout from '../layouts/TitleBulletsLayout';
import TitleBodyLayout from '../layouts/TitleBodyLayout';
import TitleImageLayout from '../layouts/TitleImageLayout';
import TwoColumnLayout from '../layouts/TwoColumnLayout';
import type { Slide, SlideLayout } from '../types';

interface SlideLayoutRendererProps {
  slide: Slide;
  onChange?: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: string) => Promise<string>;
}

const SlideLayoutRenderer: React.FC<SlideLayoutRendererProps> = ({ slide, onChange = () => {}, onImageUpload, onImageGenerate }) => {
  switch (slide.layout) {
    case 'title-bullets':
      return <TitleBulletsLayout slide={slide} onChange={onChange} />;
    case 'title-body':
      return <TitleBodyLayout slide={slide} onChange={onChange} />;
    case 'title-image':
      return <TitleImageLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
    case 'title-body-image':
      return <TitleBodyLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
    case 'two-column':
      return <TwoColumnLayout slide={slide} onChange={onChange} />;
    default:
      return <TitleBulletsLayout slide={slide} onChange={onChange} />;
  }
};

export default SlideLayoutRenderer;
