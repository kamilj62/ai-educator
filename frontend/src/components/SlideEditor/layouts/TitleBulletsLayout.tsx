import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import type { Slide, SlideImage } from '../types';
import Image from 'next/image';
import { Rnd } from 'react-rnd'; // Fix the Rnd import to use named import
import ImageUploader from '../components/ImageUploader';
import TiptapEditor from '../components/TiptapEditor';
import { useState, useEffect } from 'react';

interface TitleBulletsLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: ((prompt: string) => Promise<string>) | ((prompt: string, service?: any) => Promise<SlideImage>);
}

function normalizeImageGenerate(onImageGenerate?: ((prompt: string) => Promise<string>) | ((prompt: string, service?: any) => Promise<SlideImage>)) {
  if (!onImageGenerate) return undefined;
  if (onImageGenerate.length === 1) {
    return async (prompt: string, service?: any): Promise<SlideImage> => {
      const result = await (onImageGenerate as (prompt: string) => Promise<string>)(prompt);
      return {
        url: result,
        alt: prompt,
        service: 'upload', 
      };
    };
  }
  return onImageGenerate as (prompt: string, service?: any) => Promise<SlideImage>;
}

const isDraggingOrResizing = (image: SlideImage) => {
  return image.x !== undefined || image.y !== undefined || image.width !== undefined || image.height !== undefined;
};

const getHtmlContent = (content: string | undefined): string => {
  if (!content) return '';
  if (typeof content !== 'string') return '';
  if (content.startsWith('<')) return content;
  return `<p>${content}</p>`;
};

const getBulletsHtml = (bullets: string) => {
  if (!bullets) return '';
  const lines = bullets.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  return `<ul>` + lines.map(line => `<li>${line}</li>`).join('') + `</ul>`;
};

// Normalize bullets to HTML string
function normalizeBullets(bullets: any): string {
  if (!bullets) return '';
  if (typeof bullets === 'string') {
    // If already HTML, return as is
    if (bullets.trim().startsWith('<ul')) return bullets;
    // If plain text, split by newlines
    const lines = bullets.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length) return `<ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
    return '';
  }
  if (Array.isArray(bullets)) {
    // Array of strings or objects
    const lines = bullets.map(b => typeof b === 'string' ? b : (b && b.text ? b.text : '')).filter(Boolean);
    if (lines.length) return `<ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
    return '';
  }
  return '';
}

const TitleBulletsLayout: React.FC<TitleBulletsLayoutProps> = ({ 
  slide, 
  onChange,
  onImageUpload,
  onImageGenerate 
}) => {
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
    <BaseLayout>
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

const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  gap: theme.spacing(2)
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: theme.palette.text.primary
}));

export default TitleBulletsLayout;
