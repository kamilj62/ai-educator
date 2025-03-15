import { Box, styled } from '@mui/material';
import BaseLayout from './BaseLayout';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
import { Slide } from '../types';

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  height: '100%',
}));

const BodyContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  gap: theme.spacing(4),
}));

interface TitleBodyLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const TitleBodyLayout = ({ slide, onChange, onImageUpload }: TitleBodyLayoutProps) => {
  const handleTitleChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title: content,
      },
    });
  };

  const handleBodyChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        body: content,
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
      <ContentContainer>
        <Box>
          <TiptapEditor
            content={slide.content.title || ''}
            onChange={handleTitleChange}
            placeholder="Enter title..."
          />
        </Box>
        <BodyContainer>
          <Box flex={1}>
            <TiptapEditor
              content={slide.content.body || ''}
              onChange={handleBodyChange}
              placeholder="Enter content..."
            />
          </Box>
          {slide.layout === 'title-body-image' && (
            <Box width="40%">
              <ImageUploader
                imageUrl={slide.content.image?.url}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
              />
            </Box>
          )}
        </BodyContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleBodyLayout;
