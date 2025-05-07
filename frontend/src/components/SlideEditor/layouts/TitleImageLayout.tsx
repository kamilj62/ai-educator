import React, { useCallback, useState, useEffect } from 'react';
import { Box, Paper, styled, Typography } from '@mui/material';
import { TiptapSlideEditor as TiptapEditor } from '../components/TiptapSlideEditor';
import ImageUploader from '../components/ImageUploader';
import type { Slide, SlideImage, ImageService } from '../types';
import Image from 'next/image';
import { Rnd } from 'react-rnd';

const BaseLayout = styled(Box)(({ theme }) => ({
  width: '100%',
  aspectRatio: '16/9',
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  backgroundColor: 'transparent',
}));

// Only for the title
const TitleContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  fontWeight: 700,
  fontSize: 28,
  color: 'black',
  textAlign: 'left',
  width: '100%'
}));

// This will fill the slide area (no padding)
const SlideArea = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 600, 
  display: 'flex',
  flexDirection: 'column',
}));

const ImageArea = styled(Box)(({ theme }) => ({
  position: 'relative',
  flex: '1 1 0%',
  minHeight: 0,
  height: '100%',
  width: '100%',

  background: '#fffbe7',
  /* border: '2px solid blue', */
  margin: '0 auto',
  maxHeight: '70%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  '& img': {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(4),
  height: '100%',
}));

interface TitleImageLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
}

const getValidImage = (img: unknown): SlideImage | undefined => {
  if (!img || typeof img !== 'object') return undefined;
  const imageObj = img as Partial<SlideImage>;
  return {
    ...imageObj,
    url: imageObj.url || '',
  } as SlideImage;
};

const DEFAULT_IMAGE_Y = 90; // px, image starts below the title visually

const TitleImageLayout: React.FC<TitleImageLayoutProps> = ({ slide, onChange, onImageUpload, onImageGenerate }) => {
  const handleTitleChange = useCallback((title: string) => {
    onChange({
      ...slide,
      content: { ...slide.content, title },
    });
  }, [slide, onChange]);

  const handleImageChange = useCallback((image: SlideImage) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        image: {
          ...image,
          url: image.url,
          alt: image.alt || 'Slide image',
        },
      },
    });
  }, [slide, onChange]);

  const image = getValidImage(slide.content.image);

  // Only set default y if not already set
  const initialY = image && typeof image.y === 'number' ? image.y : DEFAULT_IMAGE_Y;

  return (

    <BaseLayout>
      <Box sx={{ position: 'relative', width: '100%', height: 600, display: 'flex', flexDirection: 'column' }}>
        {/* Title at the top, padded */}
        {slide.content.title && (
          <Box sx={{ padding: 4, fontWeight: 700, fontSize: 28, color: 'black', textAlign: 'left', width: '100%' }}>
            {slide.content.title}
          </Box>
        )}
        {/* ImageArea fills the rest of the slide below the title */}
        <ImageArea>
          {image && image.url && (
            <Box sx={{ position: 'absolute', top: initialY, left: 0, width: image.width || 400, height: image.height || 300 }}>
              <img
                src={image.url}
                alt={image.alt || 'Slide image'}
                draggable={false}
                style={{
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  objectFit: 'contain',
                  userSelect: 'none',
                  cursor: 'grab',
                  width: '100%',
                  height: '100%',
                }}
              />
            </Box>
          )}
        </ImageArea>
      </Box>
      <Box mb={4}>
        <TiptapEditor
          content={slide.content.title || ''}
          onChange={handleTitleChange}
          placeholder="Enter title..."
          type="slide"
        />
      </Box>
      <ContentContainer>
        <Box>
          {slide.content.subtitle && (
            <TiptapEditor
              content={slide.content.subtitle}
              onChange={(content) =>
                onChange({
                  ...slide,
                  content: { ...slide.content, subtitle: content },
                })
              }
              placeholder="Enter subtitle..."
              type="slide"
            />
          )}
        </Box>
        <Box>
          <ImageUploader
            image={slide.content.image}
            onImageChange={handleImageChange}
            onImageUpload={onImageUpload}
            onImageGenerate={onImageGenerate}
          />
        </Box>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleImageLayout;
