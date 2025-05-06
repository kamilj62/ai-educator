<<<<<<< HEAD
<<<<<<< HEAD
import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import type { Slide, SlideImage } from '../types';
import Image from 'next/image';
import { Rnd } from 'react-rnd'; 
import ImageUploader from '../components/ImageUploader';
import TiptapEditor from '../components/TiptapEditor';
import { useState, useEffect } from 'react';
=======
<<<<<<< HEAD
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
<<<<<<< HEAD
import type { Slide } from '../types';
<<<<<<< HEAD
=======
import { Box, styled } from '@mui/material';
import BaseLayout from './BaseLayout';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
import { Slide } from '../types';

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  height: '100%',
}));

const BulletsContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  gap: theme.spacing(4),
}));

const BulletList = styled(Box)(({ theme }) => ({
  flex: 1,
  '& ul': {
    margin: 0,
    paddingLeft: theme.spacing(2),
  },
}));
>>>>>>> dd7ecbd (added imagen images)
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
=======
import type { Slide, SlideImage } from '../types';
import Image from 'next/image';
import { Rnd } from 'react-rnd'; // Fix the Rnd import to use named import
import ImageUploader from '../components/ImageUploader';
import TiptapEditor from '../components/TiptapEditor';
import { useState, useEffect } from 'react';
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)

interface TitleBulletsLayoutProps {
  slide: Slide;
  index: number;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  onImageGenerate?: ((prompt: string) => Promise<string>) | ((prompt: string, service?: any) => Promise<SlideImage>);
=======
<<<<<<< HEAD
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
  onImageGenerate?: (prompt: string) => Promise<string>;
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
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
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
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

// Fix: Ensure url is always a string when constructing SlideImage objects
const getValidImage = (img: any): SlideImage | undefined => {
  if (!img || typeof img !== 'object') return undefined;
  return {
    ...img,
    url: img.url || '', // Always a string
  };
};

const TitleBulletsLayout: React.FC<TitleBulletsLayoutProps> = ({ 
  slide, 
  index,
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
<<<<<<< HEAD

  const image = getValidImage(slide.content.image);

  return (
    <BaseLayout>
      <ContentContainer>
        {/* Render the slide title at the top */}
        {slide.content.title && (
          <TitleContainer>
            {slide.content.title}
          </TitleContainer>
<<<<<<< HEAD
        )}
        {/* Render bullets if present */}
        {slide.content.bullets && (
          <span
            style={{
              fontSize: '2rem',
              color: '#222',
              display: 'block',
              marginTop: '0.5rem',
              textAlign: 'left',
              lineHeight: 1.35,
              maxWidth: '100%',
            }}
            dangerouslySetInnerHTML={{
              __html:
                typeof slide.content.bullets === 'string'
                  ? (slide.content.bullets.trim().startsWith('<')
                      ? slide.content.bullets
                      : `<ul>${slide.content.bullets
                          .split('\n')
                          .map(line => `<li>${line.trim()}</li>`)
                          .join('')}</ul>`)
                  : ''
            }}
          />
        )}
        {/* Show draggable/resizable image at the top if present */}
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
            style={{ zIndex: 2, display: 'block', margin: '0 auto 2.5rem auto' }}
            dragHandleClassName="draggable-image-handle"
            onDragStop={(e, d) => {
=======
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
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
              onChange({
                ...slide,
                content: {
                  ...slide.content,
                  image: {
<<<<<<< HEAD
                    ...image,
                    x: d.x,
                    y: d.y,
=======
                    ...slide.content.image,
                    x: d.x,
                    y: d.y,
                    url: slide.content.image.url || '',
                    alt: slide.content.image.alt || '',
                    service: slide.content.image.service || 'upload',
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
                  },
                },
              });
            }}
<<<<<<< HEAD
            onResizeStop={(e, direction, ref, delta, position) => {
=======
            onResizeStop={(e: any, direction: any, ref: any, delta: any, position: any) => {
              if (!slide.content.image) return;
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
              onChange({
                ...slide,
                content: {
                  ...slide.content,
                  image: {
<<<<<<< HEAD
                    ...image,
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                    x: position.x,
                    y: position.y,
=======
                    ...slide.content.image,
                    width: parseInt(ref.style.width, 10),
                    height: parseInt(ref.style.height, 10),
                    x: position.x,
                    y: position.y,
                    url: slide.content.image.url || '',
                    alt: slide.content.image.alt || '',
                    service: slide.content.image.service || 'upload',
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
                  },
                },
              });
            }}
          >
            <img
<<<<<<< HEAD
              src={image.url}
              alt={image.alt || 'Slide image'}
              className="draggable-image-handle"
              draggable={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                maxWidth: '100%',
                maxHeight: 500,
                objectFit: 'contain',
                userSelect: 'none',
                cursor: 'grab',
                width: '100%',
                height: '100%',
              }}
            />
          </Rnd>
        )}
=======
          <BulletList>
            {slide.content.bullets?.map((bullet, index) => (
              <BulletPoint key={index}>
                {bullet.text}
              </BulletPoint>
            ))}
          </BulletList>
          {slide.content.image?.url && (
            <ImageContainer>
              <Box
                component="img"
                src={slide.content.image.url}
                alt={slide.content.image.alt || 'Slide image'}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </ImageContainer>
          )}
        </BulletsContainer>
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
              src={slide.content.image.url}
              alt={slide.content.image.alt || 'Slide image'}
              style={{ width: '100%', height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', cursor: 'grab', transition: 'box-shadow 0.2s, transform 0.1s' }}
              className="draggable-image-handle"
              draggable={false}
            />
          </Rnd>
        )}
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
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

<<<<<<< HEAD
<<<<<<< HEAD
=======
const BulletList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}));

const BulletPoint = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  color: theme.palette.text.secondary,
  '&:before': {
    content: '"•"',
    marginRight: theme.spacing(1)
  }
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '200px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper
}));

<<<<<<< HEAD
=======
>>>>>>> dd7ecbd (added imagen images)
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
=======
>>>>>>> af57c608 (feat: Restore draggable/resizable images below text for all image layouts with smooth movement)
export default TitleBulletsLayout;
