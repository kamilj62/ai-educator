import React from 'react';
import Image from 'next/image';
import { Box, styled, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import type { Slide, SlideImage } from '../types';
import { Rnd, DraggableData, ResizableDelta } from 'react-rnd';
import ImageUploader from '../components/ImageUploader';
import TiptapEditor from '../components/TiptapEditor';

interface TitleBulletsLayoutProps {
  slide: Slide;
  index: number;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: any) => Promise<SlideImage>;
}

const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  gap: theme.spacing(2)
}));

const BulletsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

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

const TitleContainer = styled(Box)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: theme.palette.text.primary
}));

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

  // Helper to parse HTML <ul><li>...</li></ul> to string[]
  function parseBulletsFromHtml(html: string): string[] {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const lis = Array.from(doc.querySelectorAll('li'));
    return lis.map(li => li.textContent || '');
  }

  const handleBulletsChange = (html: string) => {
    const bullets = parseBulletsFromHtml(html);
    onChange({
      ...slide,
      content: { ...slide.content, bullets },
    });
  };

  const handleImageChange = (image: SlideImage) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        image: {
          url: image.url,
          alt: image.alt || 'Slide image',
          service: image.service || 'upload',
        },
      },
    });
  };

  const image = slide.content.image;
  const bulletPoints: string[] = Array.isArray(slide.content.bullets) ? slide.content.bullets : [];

  return (
    <BaseLayout>
      <ContentContainer>
        <TitleContainer>
          <TiptapEditor
            content={slide.content.title || ''}
            onChange={handleTitleChange}
            placeholder="Enter title..."
          />
        </TitleContainer>
        <BulletsContainer>
          <BulletList>
            {bulletPoints.map((bullet, idx) => (
              <BulletPoint key={idx}>{bullet}</BulletPoint>
            ))}
            <TiptapEditor
              content={Array.isArray(slide.content.bullets) ? `<ul>${slide.content.bullets.map((b: string) => `<li>${b}</li>`).join('')}</ul>` : ''}
              onChange={handleBulletsChange}
              placeholder="Enter bullet points..."
            />
          </BulletList>
          {slide.layout === 'title-bullets-image' && (
            <Box width="40%">
              <ImageUploader
                image={image}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
              />
            </Box>
          )}
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
              onDragStop={(_e: any, d: DraggableData) => {
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
              onResizeStop={(_e: any, _direction: any, ref: HTMLElement, _delta: ResizableDelta, position: { x: number; y: number }) => {
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
              <Image 
                src={image.url} 
                alt={image.alt || ''} 
                width={240} 
                height={120} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 120, 
                  marginTop: 8, 
                  objectFit: 'contain' 
                }} 
                className="draggable-image-handle"
                draggable={false}
              />
            </Rnd>
          )}
        </BulletsContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleBulletsLayout;
