import * as React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import BaseLayout from './BaseLayout';
import { Slide, SlideContent, SlideImage } from '../../types';
import { Rnd } from 'react-rnd';
import ImageUploader from '../components/ImageUploader';

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

const TitleContainer = styled(Box)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: theme.palette.text.primary
}));

const BulletList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}));

const BulletPoint = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  color: theme.palette.text.secondary,
  opacity: 0.9,  // Slightly more transparent
  '&:before': {
    content: '"•"',
    marginRight: theme.spacing(1),
    color: theme.palette.grey[400]  // Lighter color for the bullet
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

function getHtmlContent(content: string | undefined): string {
  if (!content) return '';
  if (typeof content !== 'string') return '';
  if (content.startsWith('<')) return content;
  return `<p>${content}</p>`;
}

// Normalize bullets to HTML string
function normalizeBullets(bullets: any): string {
  if (!bullets) return '';
  if (typeof bullets === 'string') {
    if (bullets.trim().startsWith('<ul')) return bullets;
    const lines = bullets.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length) return `<ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
    return '';
  }
  if (Array.isArray(bullets)) {
    const lines = bullets.map(b => typeof b === 'string' ? b : (b && b.text ? b.text : '')).filter(Boolean);
    if (lines.length) return `<ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
    return '';
  }
  return '';
}

const TitleBulletsLayout: React.FC<TitleBulletsLayoutProps> = ({ slide, index, onChange, onImageUpload, onImageGenerate }) => {
  const image = slide.content.image;
  // Parse bullets HTML to array for rendering
  let bulletsArr: string[] = [];
  if (typeof slide.content.bullets === 'string') {
    bulletsArr = slide.content.bullets
      .replace(/<ul>|<\/ul>/g, '')
      .split(/<li>|<\/li>/)
      .map(b => b.trim())
      .filter(Boolean);
  }

  return (
    <BaseLayout>
      <ContentContainer>
        {slide.content.title && (
          <TitleContainer>{slide.content.title.replace(/<[^>]+>/g, '')}</TitleContainer>
        )}
        {bulletsArr.length > 0 && (
          <BulletList>
            {bulletsArr.map((bullet, idx) => (
              <BulletPoint key={idx}>{bullet}</BulletPoint>
            ))}
          </BulletList>
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
            minWidth={120}
            minHeight={80}
            maxWidth={650}
            maxHeight={500}
            style={{ zIndex: 2, display: 'block', margin: '0 auto 2.5rem auto' }}
            dragHandleClassName="draggable-image-handle"
            onDragStop={(e, d) => {
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

export default TitleBulletsLayout;
