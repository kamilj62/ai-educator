import React from 'react';
import { Slide } from '../../types';
import TitleBodyLayout from '../layouts/TitleBodyLayout';
import TitleBulletsLayout from '../layouts/TitleBulletsLayout';
import TwoColumnLayout from '../layouts/TwoColumnLayout';

interface SlideLayoutRendererProps {
  slide: any;
  onChange: (slide: any) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: string) => Promise<any>;
}

const SlideLayoutRenderer: React.FC<SlideLayoutRendererProps> = ({ slide, onChange, onImageUpload, onImageGenerate }) => {
  // Determine the layout based on the slide content
  const getLayoutType = (slide: any) => {
    if (slide.layout) return slide.layout;
    
    // Infer layout based on content
    if (slide.content?.bullets || slide.content?.key_points) {
      return 'title-bullets';
    }
    
    return 'title-body'; // Default layout
  };
  
  const layoutType = getLayoutType(slide);
  
  const commonProps = {
    slide,
    onChange,
    onImageUpload,
    onImageGenerate,
    index: 0 // Default index, can be updated if needed
  };

  switch (layoutType) {
    case 'title-body':
      return <TitleBodyLayout {...commonProps} />;
    case 'title-bullets':
      return <TitleBulletsLayout {...commonProps} />;
    case 'two-column':
      return <TwoColumnLayout {...commonProps} />;
    default:
      return <div>Unknown layout: {slide.layout}</div>;
  }
};

export default SlideLayoutRenderer;
