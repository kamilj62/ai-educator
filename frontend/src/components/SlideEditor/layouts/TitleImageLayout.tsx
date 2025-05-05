import React, { useCallback, useState, useEffect } from 'react';
import { Box, styled, Typography } from '@mui/material';
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
  border: '2px solid blue',
  margin: '0 auto',
  display: 'block',
}));

interface TitleImageLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
}

// Fix: Ensure url is always a string when constructing SlideImage objects
const getValidImage = (img: unknown): SlideImage | undefined => {
  if (!img || typeof img !== 'object') return undefined;
  const imageObj = img as Partial<SlideImage>;
  return {
    ...imageObj,
    url: imageObj.url || '', // Always a string
  } as SlideImage;
};

const DEFAULT_IMAGE_Y = 90; // px, image starts below the title visually

const TitleImageLayout: React.FC<TitleImageLayoutProps> = ({ slide, onChange }) => {
  const handleTitleChange = (title: string) => {
    onChange({
      ...slide,
      content: { ...slide.content, title },
    });
  };
  const handleBulletsChange = (bullets: string) => {
    onChange({
      ...slide,
      content: { ...slide.content, bullets },
    });
  };

  const image = getValidImage(slide.content.image);

  // Only set default y if not already set
  const initialY = image && typeof image.y === 'number' ? image.y : DEFAULT_IMAGE_Y;

  return (
    <BaseLayout>
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
              enableResizing={{
                top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
              }}
              lockAspectRatio={true}
              minWidth={150}
              minHeight={120}
              maxWidth={650}
              maxHeight={500}
              style={{ zIndex: 2, display: 'block' }}
              dragHandleClassName="draggable-image-handle"
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
              onResizeStop={(e, direction, ref, delta, position) => {
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
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  objectFit: 'contain',
                  userSelect: 'none',
                  cursor: 'grab',
                  width: '100%',
                  height: '100%',
                }}
              />
            </Rnd>
          )}
        </ImageArea>
      </SlideArea>
    </BaseLayout>
  );
};

export default TitleImageLayout;
