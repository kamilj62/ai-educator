import React, { useCallback, useState, useEffect } from 'react';
import { Box, Paper, styled, Typography } from '@mui/material';
import ImageUploader from '../components/ImageUploader';
import type { Slide, SlideImage, ImageService } from '../types';
import Image from 'next/image';
import { Rnd } from 'react-rnd';

const BaseLayout = styled(Paper)(({ theme }) => ({
  width: '100%',
  aspectRatio: '16/9',
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  backgroundColor: 'transparent',
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  fontWeight: 700,
  fontSize: 28,
  color: 'black',
  textAlign: 'left',
  width: '100%'
}));

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
  margin: '0 auto',
  display: 'block',
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
    url: imageObj.url || '', // Always a string
    alt: imageObj.alt || '',
    service: imageObj.service || 'upload',
    x: imageObj.x || 0,
    y: imageObj.y || 0,
    width: imageObj.width || 300,
    height: imageObj.height || 200,
  };
};

const TitleImageLayout: React.FC<TitleImageLayoutProps> = ({ slide, onChange, onImageUpload, onImageGenerate }) => {
  const handleTitleChange = (title: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title,
      },
    });
  };

  const handleImageChange = useCallback((image: SlideImage) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        image,
      },
    });
  }, [slide, onChange]);

  const image = getValidImage(slide.content.image);

  return (
    <BaseLayout elevation={1}>
      <SlideArea>
        {/* Title at the top, padded */}
        {slide.content.title && (
          <TitleContainer>
            {slide.content.title}
          </TitleContainer>
        )}
        {/* ImageArea fills the rest of the slide below the title */}
        <ImageArea>
          {image && image.url && (
            <Rnd
              bounds="parent"
              size={{
                width: image.width || 400,
                height: image.height || 300,
              }}
              position={{
                x: image.x || 0,
                y: image.y || 0,
              }}
              onDragStop={(e, d) => {
                onChange({
                  ...slide,
                  content: {
                    ...slide.content,
                    image: {
                      ...image,
                      x: d.x,
                      y: d.y,
                    },
                  },
                });
              }}
              onResize={(e, direction, ref, delta, position) => {
                onChange({
                  ...slide,
                  content: {
                    ...slide.content,
                    image: {
                      ...image,
                      width: ref.offsetWidth,
                      height: ref.offsetHeight,
                      x: position.x,
                      y: position.y,
                    },
                  },
                });
              }}
            >
              <img
                src={image.url}
                alt={image.alt || 'Slide image'}
                className="draggable-image-handle"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                  cursor: 'grab',
                }}
              />
            </Rnd>
          )}
        </ImageArea>
        <Box>
          <ImageUploader
            imageUrl={slide.content.image?.url}
            onImageChange={handleImageChange}
            onImageUpload={onImageUpload}
          />
        </Box>
      </SlideArea>
    </BaseLayout>
  );
};

export default TitleImageLayout;
