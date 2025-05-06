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
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import type { Slide } from '../types';
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

interface TitleBulletsLayoutProps {
  slide: Slide;
  index: number;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
<<<<<<< HEAD
  onImageGenerate?: ((prompt: string) => Promise<string>) | ((prompt: string, service?: any) => Promise<SlideImage>);
=======
<<<<<<< HEAD
  onImageGenerate?: (prompt: string) => Promise<string>;
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
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
=======
}

const TitleBulletsLayout = ({ slide, onChange, onImageUpload }: TitleBulletsLayoutProps) => {
  const handleTitleChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title: content,
      },
    });
  };

  const handleBulletsChange = (content: string) => {
    // Convert HTML bullet points to array
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const bullets = Array.from(tempDiv.querySelectorAll('li')).map(li => li.textContent || '');

    onChange({
      ...slide,
      content: {
        ...slide.content,
        bullets,
      },
    });
  };

  const handleImageChange = (imageUrl: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        image: {
          url: imageUrl,
          alt: 'Slide image',
        },
      },
    });
  };

  // Convert bullet array to HTML content
  const getBulletsContent = () => {
    if (!slide.content.bullets?.length) return '';
    return `<ul>${slide.content.bullets.map(bullet => `<li>${bullet}</li>`).join('')}</ul>`;
  };

  return (
    <BaseLayout>
      <ContentContainer>
        <Box>
          <TiptapEditor
            content={slide.content.title || ''}
            onChange={handleTitleChange}
            placeholder="Enter title..."
          />
        </Box>
        <BulletsContainer>
          <BulletList>
            <TiptapEditor
              content={getBulletsContent()}
              onChange={handleBulletsChange}
              placeholder="Enter bullet points..."
            />
          </BulletList>
          {slide.layout === 'title-bullets-image' && (
            <Box width="40%">
              <ImageUploader
                imageUrl={slide.content.image?.url}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
              />
            </Box>
>>>>>>> dd7ecbd (added imagen images)
          )}
        </BulletsContainer>
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
      </ContentContainer>
    </BaseLayout>
  );
};

<<<<<<< HEAD
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

=======
>>>>>>> dd7ecbd (added imagen images)
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
export default TitleBulletsLayout;
