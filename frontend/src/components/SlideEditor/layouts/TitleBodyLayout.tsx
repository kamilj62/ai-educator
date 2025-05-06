<<<<<<< HEAD
<<<<<<< HEAD
import React from 'react';
=======
<<<<<<< HEAD
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import BaseLayout from './BaseLayout';
<<<<<<< HEAD
import { Rnd } from 'react-rnd';
=======
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
<<<<<<< HEAD
import type { Slide, ImageService, SlideImage } from '../types';
=======
import type { Slide, SlideImage, ImageService } from '../types';

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  height: '100%',
  padding: theme.spacing(4),
  '& .ProseMirror': {
    '&:focus': {
      outline: 'none',
    },
  },
  '& .title-editor': {
    '& .ProseMirror': {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: theme.palette.text.primary,
      lineHeight: 1.2,
      marginBottom: theme.spacing(2),
    },
  },
}));

const BodyContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  gap: theme.spacing(4),
  minHeight: 0,
}));

const TextContent = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  '& .ProseMirror': {
    fontSize: '1.25rem',
    color: theme.palette.text.primary,
    lineHeight: 1.6,
    '& p': {
      margin: '0.75em 0',
      '&:first-child': {
        marginTop: 0,
      },
      '&:last-child': {
        marginBottom: 0,
      },
    },
  },
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  width: '40%',
  minWidth: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));
>>>>>>> d07ba51 (Fix layout type errors and unify BackendSlideLayout conversions)

interface TitleBodyLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string) => Promise<string>;
}

const TitleBodyLayout: React.FC<TitleBodyLayoutProps> = ({ 
  slide, 
  onChange,
  onImageUpload,
  onImageGenerate 
}) => {
  const handleBodyChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        body: content,
      },
    });
  };

  const handleTitleChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title: content,
      },
    });
  };

  const handleImageChange = (image: SlideImage) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        image: {
          ...image,
          prompt: image.prompt || slide.content.title || 'Educational illustration'
        },
      },
    });
  };

  return (
    <BaseLayout>
      <ContentContainer>
        <TitleContainer>
          <TiptapEditor
            content={slide.content.title || ''}
            onChange={handleTitleChange}
            placeholder="Enter title..."
            bulletList={false}
          />
        </TitleContainer>
        <BodyContainer>
          <TiptapEditor
            content={slide.content.body || ''}
            onChange={handleBodyChange}
            placeholder="Enter content..."
            bulletList={false}
          />
          {slide.layout.includes('image') && (
<<<<<<< HEAD
            <ImageUploader
              currentImage={slide.content.image ? {
                ...slide.content.image,
                prompt: slide.content.image.prompt || slide.content.title || 'Educational illustration'
              } : undefined}
              onImageChange={handleImageChange}
              onImageUpload={onImageUpload}
              onImageGenerate={onImageGenerate}
            />
=======
            <ImageContainer>
              <ImageUploader
                image={slide.content.image?.url}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
                onImageGenerate={onImageGenerate}
              />
            </ImageContainer>
>>>>>>> d07ba51 (Fix layout type errors and unify BackendSlideLayout conversions)
          )}
        </BodyContainer>
      </ContentContainer>
    </BaseLayout>
  );
};
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)

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
              width: slide.content.image.width || '60%',
              height: slide.content.image.height || 280,
            }}
            position={{
              x: slide.content.image.x || 0,
              y: slide.content.image.y || 0,
            }}
            disableDragging
            enableResizing={false}
            style={{ margin: '0 auto', display: 'block' }}
          >
            <img
              src={slide.content.image.url}
              alt={slide.content.image.alt || ''}
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
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
