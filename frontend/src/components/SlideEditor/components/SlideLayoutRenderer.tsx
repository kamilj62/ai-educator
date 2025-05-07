import React from 'react';
import { Slide } from '../../types';
import TitleBodyLayout from '../layouts/TitleBodyLayout';
import TwoColumnLayout from '../layouts/TwoColumnLayout';

interface SlideLayoutRendererProps {
  slide: any;
  onChange: (slide: any) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: string) => Promise<any>;
}

const SlideLayoutRenderer: React.FC<SlideLayoutRendererProps> = ({ slide, onChange, onImageUpload, onImageGenerate }) => {
  switch (slide.layout) {
    case 'title-body':
      return <TitleBodyLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
    case 'two-column':
      return <TwoColumnLayout slide={slide} onChange={onChange} onImageUpload={onImageUpload} onImageGenerate={onImageGenerate} />;
    // Add cases for other layouts as needed
    default:
      return <div>Unknown layout: {slide.layout}</div>;
  }
};

export default SlideLayoutRenderer;
