<<<<<<< HEAD
<<<<<<< HEAD
import React from 'react';
import { useCallback, useState, useEffect } from 'react';
import { Box, styled, Typography } from '@mui/material';
=======
<<<<<<< HEAD
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
import React, { useCallback } from 'react';
import { Box, Paper, styled, Typography } from '@mui/material';
import { TiptapSlideEditor as TiptapEditor } from '../components/TiptapSlideEditor';
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
import ImageUploader from '../components/ImageUploader';
import type { Slide, SlideImage, ImageService } from '../types';
<<<<<<< HEAD
<<<<<<< HEAD
import Image from 'next/image';
import { Rnd } from 'react-rnd';
=======
=======
import type { Slide, ImageService, SlideImage } from '../types';
>>>>>>> d07ba51 (Fix layout type errors and unify BackendSlideLayout conversions)
>>>>>>> ef57eb93 (Fix layout type errors and unify BackendSlideLayout conversions)
=======
>>>>>>> 11d5af65 (Add /api/generate/image endpoint and enhancements)

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
<<<<<<< HEAD
  background: '#fffbe7',
  /* border: '2px solid blue', */
  margin: '0 auto',
  display: 'block',
=======
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
<<<<<<< HEAD
=======
import { Box, styled } from '@mui/material';
import BaseLayout from './BaseLayout';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
import { Slide } from '../types';

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(4),
  height: '100%',
>>>>>>> dd7ecbd (added imagen images)
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
}));

interface TitleImageLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
<<<<<<< HEAD
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<string>;
}

const TitleImageLayout: React.FC<TitleImageLayoutProps> = ({
  slide,
  onChange,
  onImageUpload,
  onImageGenerate,
}) => {
  const handleTitleChange = useCallback((title: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title,
      },
    });
  }, [slide, onChange]);

  const handleImageChange = useCallback((image: SlideImage) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        image,
      },
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
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

  // Fix onImageGenerate type to always return Promise<SlideImage>
  // Wrap string result in SlideImage object with all required properties
  const handleImageGenerate = async (prompt: string, service?: ImageService): Promise<SlideImage> => {
    if (!onImageGenerate) throw new Error('onImageGenerate not provided');
    const result = await onImageGenerate(prompt, service);
    if (typeof result === 'string') {
      return {
        url: result,
        prompt,
        alt: prompt,
        service: service || ({} as ImageService),
      };
    }
    return result;
  };

  console.log('TitleImageLayout image:', slide.content.image);

  return (
<<<<<<< HEAD
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
=======
    <LayoutContainer elevation={1}>
      <TitleArea>
        <TiptapEditor
          content={slide.content.title || ''}
          onChange={handleTitleChange}
          placeholder="Click to add title"
          type="slide"
        />
      </TitleArea>
      <ContentArea>
        <Box width="60%" height="100%">
          <ImageUploader
            image={slide.content.image}
            onImageChange={handleImageChange}
            onImageUpload={onImageUpload}
            onImageGenerate={handleImageGenerate}
            maxWidth={1920}
            maxHeight={1080}
          />
        </Box>
      </ContentArea>
    </LayoutContainer>
<<<<<<< HEAD
=======
        image: {
          url: imageUrl,
          alt: 'Slide image',
        },
      },
    });
  };

  return (
    <BaseLayout>
      <Box mb={4}>
        <TiptapEditor
          content={slide.content.title || ''}
          onChange={handleTitleChange}
          placeholder="Enter title..."
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
            />
          )}
        </Box>
        <Box>
          <ImageUploader
            imageUrl={slide.content.image?.url}
            onImageChange={handleImageChange}
            onImageUpload={onImageUpload}
          />
        </Box>
      </ContentContainer>
    </BaseLayout>
>>>>>>> dd7ecbd (added imagen images)
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
  );
};

export default TitleImageLayout;
