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
}));

interface TitleImageLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const TitleImageLayout = ({ slide, onChange, onImageUpload }: TitleImageLayoutProps) => {
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
  );
};

export default TitleImageLayout;
