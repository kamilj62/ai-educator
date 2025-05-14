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
  gap: theme.spacing(2),
  overflow: 'hidden', // Prevent container from scrolling
  '& > *:first-child': {
    flexShrink: 0, // Prevent title from shrinking
  },
  '& > *:last-child': {
    flexGrow: 1, // Allow content to take remaining space
    overflow: 'hidden', // Hide overflow from this container
    display: 'flex',
    flexDirection: 'column',
  }
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  lineHeight: 1.2,
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
  }
}));

const BulletList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  overflowY: 'auto', // Add scroll to bullet list
  paddingRight: theme.spacing(1),
  margin: theme.spacing(0, -1),
  padding: theme.spacing(0, 1),
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.grey[400],
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: theme.palette.grey[500],
  },
}));

const BulletPoint = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  color: theme.palette.text.primary,
  lineHeight: 1.5,
  display: 'flex',
  alignItems: 'flex-start',
  '&:before': {
    content: '"•"',
    fontSize: '1.5em',
    lineHeight: 1,
    marginRight: theme.spacing(1.5),
    color: theme.palette.primary.main,
    flexShrink: 0,
    marginTop: '0.15em',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.1rem',
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
  // Parse bullets to array for rendering
  let bulletsArr: string[] = [];
  
  // Debug log to see the slide content
  console.log('TitleBulletsLayout - slide content:', JSON.stringify(slide.content, null, 2));
  
  // Helper function to extract text from HTML
  const extractTextFromHtml = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Type definitions for bullet items
  type BulletItem = string | { text: string };
  
  // Type guard for bullet items
  const isBulletItem = (item: unknown): item is BulletItem => {
    return typeof item === 'string' || 
           (!!item && typeof item === 'object' && 'text' in item && typeof (item as {text: unknown}).text === 'string');
  };

  // Helper to get text from a bullet item
  const getBulletText = (item: BulletItem): string => {
    return typeof item === 'string' ? item : item.text;
  };

  // Try to get bullets from different possible locations
  const bulletsContent = slide.content.bullets || slide.content.key_points || [];
  
  if (Array.isArray(bulletsContent)) {
    // Process array of bullet items
    const validBullets = bulletsContent.filter(isBulletItem);
    
    bulletsArr = validBullets
      .map(item => {
        const text = getBulletText(item);
        // If it's a string that looks like HTML, extract the text
        if (typeof text === 'string' && text.trim().startsWith('<')) {
          return extractTextFromHtml(text).trim();
        }
        return text.trim();
      })
      .filter(Boolean) as string[];
  } else if (typeof bulletsContent === 'string') {
    // If it's a string, try to parse it as HTML list
    bulletsArr = bulletsContent
      .replace(/<ul>|<\/ul>|<ol>|<\/ol>/g, '')
      .split(/<li>|<\/li>/)
      .map(b => b.trim())
      .filter(Boolean)
      .map(extractTextFromHtml);
  }
  
  // If we still don't have bullets, try to extract from the body
  if (bulletsArr.length === 0 && slide.content.body) {
    const bodyText = typeof slide.content.body === 'string' ? slide.content.body : '';
    // Try different bullet point formats
    const bulletMatches = [
      ...(bodyText.match(/•([^•\n]+)/g) || []),  // • bullet points
      ...(bodyText.match(/\n\s*[-*]\s*([^\n]+)/g) || []),  // - or * bullet points
      ...(bodyText.match(/\d+\.\s*([^\n]+)/g) || [])  // 1. numbered lists
    ];
    
    if (bulletMatches.length > 0) {
      bulletsArr = bulletMatches
        .map(b => b.replace(/^[•\-*]|^\d+\./, '').trim())
        .filter(Boolean);
    } else {
      // If no bullet points found, split the body into paragraphs
      bulletsArr = bodyText
        .split('\n\n')
        .map(p => p.trim())
        .filter(Boolean);
    }
  }
  
  // Ensure we have at least one bullet point with a default message if needed
  if (bulletsArr.length === 0) {
    bulletsArr = ['No content available'];
  }

  return (
    <BaseLayout>
      <ContentContainer>
        <div>
          {slide.content.title && (
            <TitleContainer>{slide.content.title.replace(/<[^>]+>/g, '')}</TitleContainer>
          )}
        </div>
        <div>
          {bulletsArr.length > 0 && (
            <BulletList>
              {bulletsArr.map((bullet, idx) => (
                <BulletPoint key={idx}>{bullet}</BulletPoint>
              ))}
            </BulletList>
          )}
        </div>
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
