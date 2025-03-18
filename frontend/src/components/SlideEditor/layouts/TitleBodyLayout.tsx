import { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import BaseLayout from './BaseLayout';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
import type { Slide, ImageService } from '../types';

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

interface TitleBodyLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string) => Promise<string>;
}

const TitleBodyLayout = ({ slide, onChange, onImageUpload, onImageGenerate }: TitleBodyLayoutProps) => {
  const handleBodyChange = useCallback((content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        body: content,
      },
    });
  }, [slide, onChange]);

  const handleTitleChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title: content,
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
          alt: '',
          service: 'generated' as ImageService,
        },
      },
    });
  };

  return (
    <BaseLayout>
      <ContentContainer>
        <Box className="title-editor">
          <TiptapEditor
            content={slide.content.title || ''}
            onChange={handleTitleChange}
            placeholder="Enter title..."
            bulletList={false}
          />
        </Box>
        <BodyContainer>
          <TextContent>
            <TiptapEditor
              content={slide.content.body || ''}
              onChange={handleBodyChange}
              placeholder="Enter content..."
              bulletList={false}
            />
          </TextContent>
          {slide.layout.includes('image') && (
            <ImageContainer>
              <ImageUploader
                imageUrl={slide.content.image?.url}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
                onImageGenerate={onImageGenerate}
                generatePrompt={slide.content.title || 'Educational illustration'}
              />
            </ImageContainer>
          )}
        </BodyContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleBodyLayout;
