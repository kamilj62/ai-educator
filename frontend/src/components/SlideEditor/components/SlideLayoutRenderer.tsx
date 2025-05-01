import React from 'react';
import { Slide } from '../types';
import TitleBulletsLayout from '../layouts/TitleBulletsLayout';
import TitleBodyLayout from '../layouts/TitleBodyLayout';
import TitleImageLayout from '../layouts/TitleImageLayout';
import TwoColumnLayout from '../layouts/TwoColumnLayout';

interface SlideLayoutRendererProps {
  slide: Slide;
  onChange?: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string) => Promise<string>;
}

const SlideLayoutRenderer: React.FC<SlideLayoutRendererProps> = ({ slide, onChange = () => {}, onImageUpload, onImageGenerate }) => {
  switch (slide.layout) {
    case 'title-bullets':
      return <TitleBulletsLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
    case 'title-body':
      return <TitleBodyLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
    case 'title-image':
      return <TitleImageLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
    case 'two-column':
      return <TwoColumnLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
    default:
      return <TitleBulletsLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
  }
};

export default SlideLayoutRenderer;
