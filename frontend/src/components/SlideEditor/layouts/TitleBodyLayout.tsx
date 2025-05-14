import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import BaseLayout from './BaseLayout';
import { Rnd } from 'react-rnd';

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
  color: theme.palette.text.primary,
  marginTop: 0,
  marginBottom: '2.2rem',
  textAlign: 'center',
}));

interface TitleBodyLayoutProps {
  slide: any;
  onChange: (slide: any) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: string) => Promise<any>;
}

const TitleBodyLayout: React.FC<TitleBodyLayoutProps> = ({ 
  slide, 
  onChange
}) => {
  // Helper to ensure HTML for TiptapEditor
  const ensureHtml = (value: string | undefined) => {
    if (!value) return '';
    if (typeof value !== 'string') return '';
    return value.trim().startsWith('<') ? value : `<p>${value}</p>`;
  };

  return (
    <BaseLayout>
      <ContentContainer>
        {/* Title at the top, styled like TitleBulletsLayout */}
        <TitleContainer
          style={{
            background: '#fffbe7',
            color: 'black',
            zIndex: 2,
            fontSize: '3.2rem',
            fontWeight: 700,
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            marginBottom: '0.5rem',
          }}
        >
          {slide.content.title && typeof slide.content.title === 'string' ? (
            <span dangerouslySetInnerHTML={{ __html: ensureHtml(slide.content.title) }} />
          ) : (
            <span style={{color:'#bbb'}}>[No Title]</span>
          )}
        </TitleContainer>
        {/* Show draggable/resizable image at the very top if present */}
        {slide.content.image && slide.content.image.url && (
          <Rnd
            bounds="parent"
            size={{
              width: slide.content.image.width || 400,
              height: slide.content.image.height || 300,
            }}
            position={{
              x: slide.content.image.x || 0,
              y: slide.content.image.y || 0,
            }}
            minWidth={120}
            minHeight={80}
            maxWidth={800}
            maxHeight={600}
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
            onResizeStop={(e, direction, ref, delta, position) => {
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
            style={{ zIndex: 2, display: 'block', margin: '0 auto 2.5rem auto' }}
          >
            <img
              src={slide.content.image.url}
              alt={slide.content.image.alt || 'Slide image'}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain', 
                borderRadius: 8, 
                cursor: 'grab',
                transition: 'box-shadow 0.2s, transform 0.1s'
              }}
              className="draggable-image-handle"
              draggable={false}
            />
          </Rnd>
        )}
        {/* Body below title (and image if present), styled like TitleBulletsLayout */}
        <Box
          className="slide-body"
          sx={{
            fontSize: '2rem',
            color: '#222',
            display: 'block',
            marginTop: '0.5rem',
            textAlign: 'left',
            lineHeight: 1.35,
            maxWidth: '100%',
            minHeight: 120,
            wordBreak: 'break-word',
            p: 2,
            borderRadius: 2,
            boxShadow: slide.content.body ? '0 1px 8px rgba(0,0,0,0.05)' : 'none',
            mt: 2,
            fontFamily: 'inherit',
            overflow: 'visible',
            width: '100%',
            background: '#fff',
            fontWeight: 400,
            letterSpacing: '-0.01em',
          }}
        >
          {slide.content.body && typeof slide.content.body === 'string' ? (
            <span
              style={{fontSize:'2rem',fontWeight:400,lineHeight:1.35,letterSpacing:'-0.01em',color:'#222'}}
              dangerouslySetInnerHTML={{ __html: ensureHtml(slide.content.body) }}
            />
          ) : (
            <span style={{ color: '#bbb' }}>[No Body Content]</span>
          )}
        </Box>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleBodyLayout;
