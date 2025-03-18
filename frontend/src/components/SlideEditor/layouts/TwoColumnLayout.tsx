import { Box, styled } from '@mui/material';
import BaseLayout from './BaseLayout';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
import type { Slide, ImageService } from '../types';

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  height: '100%',
}));

const ColumnsContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  gap: theme.spacing(4),
}));

const Column = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  minHeight: 0,
  '& .tiptap-editor': {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    '& .ProseMirror': {
      flex: 1,
    },
  },
}));

interface TwoColumnLayoutProps {
  slide: Slide;
  onChange: (updatedSlide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<string>;
}

const TwoColumnLayout = ({ slide, onChange, onImageUpload, onImageGenerate }: TwoColumnLayoutProps) => {
  const handleTitleChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title: content,
      },
    });
  };

  const handleLeftColumnChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        columnLeft: content,
      },
    });
  };

  const handleRightColumnChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        columnRight: content,
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
          alt: `Educational illustration for ${slide.content.title || 'two-column slide'}`,
          service: 'dalle',
          caption: ''
        }
      },
    });
  };

  const handleImageGenerate = async (prompt: string) => {
    if (onImageGenerate) {
      try {
        const url = await onImageGenerate(prompt, 'dalle');
        handleImageChange(url);
      } catch (error) {
        console.error('Failed to generate image:', error);
      }
    }
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
        <ColumnsContainer>
          <Column>
            <TiptapEditor
              content={slide.content.columnLeft || ''}
              onChange={handleLeftColumnChange}
              placeholder="Enter left column content..."
            />
          </Column>
          <Column>
            {slide.layout === 'two-column-image' && (
              <ImageUploader
                imageUrl={slide.content.image?.url}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
              />
            )}
            {slide.layout !== 'two-column-image' && (
              <TiptapEditor
                content={slide.content.columnRight || ''}
                onChange={handleRightColumnChange}
                placeholder="Enter right column content..."
              />
            )}
          </Column>
        </ColumnsContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TwoColumnLayout;
