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
}));

interface TitleImageLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<string>;
}

const TitleImageLayout: React.FC<TitleImageLayoutProps> = ({
  slide,
  onChange,
  onImageUpload,
  onImageGenerate,
}) => {
  const handleTitleChange = useCallback((title: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title,
      },
    });
  }, [slide, onChange]);

  const handleImageChange = useCallback((image: SlideImage) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
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
  );
};

export default TitleImageLayout;
