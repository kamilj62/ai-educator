<<<<<<< HEAD
import React, { useCallback } from 'react';
import { Box, Paper, styled, Typography } from '@mui/material';
import { TiptapSlideEditor as TiptapEditor } from '../components/TiptapSlideEditor';
import ImageUploader from '../components/ImageUploader';
import type { Slide, SlideImage, ImageService } from '../types';

const LayoutContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  aspectRatio: '16/9',
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const TitleArea = styled(Box)(({ theme }) => ({
  flex: 'none',
  '& .ProseMirror': {
    fontSize: '2rem',
    fontWeight: 600,
    '&:focus': {
      outline: 'none',
    },
  },
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 0,
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
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
}));

interface TitleImageLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
<<<<<<< HEAD
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<string>;
}

const TitleImageLayout: React.FC<TitleImageLayoutProps> = ({
  slide,
  onChange,
  onImageUpload,
  onImageGenerate,
}) => {
  const handleTitleChange = useCallback((title: string) => {
=======
}

const TitleImageLayout = ({ slide, onChange, onImageUpload }: TitleImageLayoutProps) => {
  const handleTitleChange = (content: string) => {
>>>>>>> dd7ecbd (added imagen images)
    onChange({
      ...slide,
      content: {
        ...slide.content,
<<<<<<< HEAD
        title,
      },
    });
  }, [slide, onChange]);

  const handleImageChange = useCallback((image: SlideImage) => {
=======
        title: content,
      },
    });
  };

  const handleImageChange = (imageUrl: string) => {
>>>>>>> dd7ecbd (added imagen images)
    onChange({
      ...slide,
      content: {
        ...slide.content,
<<<<<<< HEAD
        image,
      },
    });
  }, [slide, onChange]);

  return (
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
            currentImage={slide.content.image}
            onImageChange={handleImageChange}
            onImageUpload={onImageUpload}
            onImageGenerate={onImageGenerate}
            maxWidth={1920}
            maxHeight={1080}
          />
        </Box>
      </ContentArea>
    </LayoutContainer>
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
  );
};

export default TitleImageLayout;
