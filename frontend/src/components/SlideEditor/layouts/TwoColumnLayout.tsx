import React from 'react';
import { Box, styled, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import type { Slide, ImageService, SlideImage } from '../types';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';

const PreviewWrapper = styled('div')(() => ({
  width: 320,
  height: 180,
  overflowX: 'auto', 
  overflowY: 'hidden',
  borderRadius: 8,
  background: '#f8f8ff', 
  boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start', 
}));

const PreviewContentContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  height: '100%',
  alignItems: 'stretch',
  justifyContent: 'stretch',
  gap: 4,
}));

const PreviewColumn = styled(Box)(() => ({
  width: '50%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  padding: 8,
  background: '#fff',
  fontSize: '0.8rem',
  overflow: 'hidden',
  boxSizing: 'border-box',
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1), 
  height: '100%',
  width: '100%',
  alignItems: 'stretch',
  justifyContent: 'stretch',
  padding: 0, 
  boxSizing: 'border-box',
  overflow: 'visible', 
}));

const Column = styled(Box)(({ theme }) => ({
  flex: 1, 
  minWidth: 0, 
  maxWidth: 'none', 
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  background: '#fff',
  borderRadius: 0,
  boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
  // border: '1px dashed #d0d', // debug - commented out
  alignItems: 'flex-start',
  fontSize: '1rem',
  padding: theme.spacing(1), 
  height: '100%', 
  boxSizing: 'border-box',
  overflow: 'visible', 
}));

interface TwoColumnLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
  preview?: boolean;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ 
  slide, 
  onChange,
  onImageUpload,
  onImageGenerate,
  preview
}) => {
  if (preview === true) {
    return (
      <Box sx={{ width: 320, height: 180, borderRadius: 2, background: '#f8f8ff', boxShadow: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', alignItems: 'stretch', justifyContent: 'stretch', gap: 1 }}>
          <Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 1, background: '#fff', fontSize: '0.8rem', overflow: 'hidden', boxSizing: 'border-box' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{slide.content.title}</Typography>
            <div dangerouslySetInnerHTML={{ __html: slide.content.columnLeft || '' }} />
          </Box>
          <Box sx={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 1, background: '#fff', fontSize: '0.8rem', overflow: 'hidden', boxSizing: 'border-box' }}>
            <div dangerouslySetInnerHTML={{ __html: slide.content.columnRight || '' }} />
            {slide.layout === 'two-column-image' && slide.content.image?.url && (
              <img src={slide.content.image.url} alt={slide.content.image.alt || 'Slide image'} style={{ maxWidth: '100%', maxHeight: 60, marginTop: 4 }} />
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  const handleTitleChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title: content,
      },
    });
  };

  const handleLeftColumnChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        columnLeft: content,
      },
    });
  };

  const handleRightColumnChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        columnRight: content,
      },
    });
  };

  const handleImageChange = (image: SlideImage) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        image,
      },
    });
  };

  const handleImageGenerate = async (prompt: string, service?: ImageService): Promise<SlideImage> => {
    if (onImageGenerate) {
      try {
        const image = await onImageGenerate(prompt, service);
        handleImageChange(image);
        return image;
      } catch (error) {
        console.error('Failed to generate image:', error);
        return { url: '', alt: 'Image generation failed' } as SlideImage;
      }
    }
    return { url: '', alt: 'Image generation failed' } as SlideImage;
  };

  return (
    <BaseLayout>
      <ContentContainer>
        <Column>
          <TiptapEditor
            content={slide.content.title || ''}
            onChange={handleTitleChange}
            placeholder="Enter title..."
          />
        </Column>
        <Column>
          <TiptapEditor
            content={slide.content.columnLeft || ''}
            onChange={handleLeftColumnChange}
            placeholder="Enter left column content..."
          />
        </Column>
        <Column>
          {slide.layout === 'two-column-image' ? (
            <ImageUploader
              image={slide.content.image}
              onImageChange={handleImageChange}
              onImageUpload={onImageUpload}
              onImageGenerate={handleImageGenerate}
            />
          ) : (
            <TiptapEditor
              content={slide.content.columnRight || ''}
              onChange={handleRightColumnChange}
              placeholder="Enter right column content..."
            />
          )}
        </Column>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TwoColumnLayout;
