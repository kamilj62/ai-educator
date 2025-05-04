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
  backgroundColor: theme.palette.background.paper,
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 0,
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  flex: 'none',
}));

interface TitleImageLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
}

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
  return (
    <BaseLayout elevation={1}>
      <ContentContainer>
        <TitleContainer>
          <span
            style={{ fontSize: '2.2rem', fontWeight: 600, color: '#222', display: 'block', marginBottom: '1rem' }}
            dangerouslySetInnerHTML={{ __html: typeof slide.content.title === 'string' ? (slide.content.title.trim().startsWith('<') ? slide.content.title : `<p>${slide.content.title}</p>`) : '' }}
          />
        </TitleContainer>
        <span
          style={{ fontSize: '1.25rem', color: '#333', display: 'block', marginTop: '1.5rem' }}
          dangerouslySetInnerHTML={{ __html: typeof slide.content.bullets === 'string' ? (slide.content.bullets.trim().startsWith('<') ? slide.content.bullets : `<ul>${slide.content.bullets.split('\n').map(line => `<li>${line.trim()}</li>`).join('')}</ul>`) : '' }}
        />
        {/* Draggable/Resizable image below text */}
        {slide.content.image && slide.content.image.url && (
          <Rnd
            default={{
              x: slide.content.image.x || 100,
              y: slide.content.image.y || 320,
              width: slide.content.image.width || 300,
              height: slide.content.image.height || 200,
            }}
            bounds="parent"
            enableResizing={true}
            dragHandleClassName="draggable-image-handle"
            disableDragging={false}
            style={{ zIndex: 2, marginTop: 32, transition: 'box-shadow 0.2s, transform 0.1s' }}
            onDragStart={() => {
              // Optional: add visual feedback for dragging
            }}
            onDragStop={(e: any, d: any) => {
              if (!slide.content.image) return;
              onChange({
                ...slide,
                content: {
                  ...slide.content,
                  image: {
                    ...slide.content.image,
                    x: d.x,
                    y: d.y,
                    url: slide.content.image.url || '',
                    alt: slide.content.image.alt || '',
                    service: slide.content.image.service || 'upload',
                  },
                },
              });
            }}
            onResizeStop={(e: any, direction: any, ref: any, delta: any, position: any) => {
              if (!slide.content.image) return;
              onChange({
                ...slide,
                content: {
                  ...slide.content,
                  image: {
                    ...slide.content.image,
                    width: parseInt(ref.style.width, 10),
                    height: parseInt(ref.style.height, 10),
                    x: position.x,
                    y: position.y,
                    url: slide.content.image.url || '',
                    alt: slide.content.image.alt || '',
                    service: slide.content.image.service || 'upload',
                  },
                },
              });
            }}
          >
            <img
              src={slide.content.image.url}
              alt={slide.content.image.alt || 'Slide image'}
              style={{ width: '100%', height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', cursor: 'grab', transition: 'box-shadow 0.2s, transform 0.1s' }}
              className="draggable-image-handle"
              draggable={false}
            />
          </Rnd>
        )}
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleImageLayout;
