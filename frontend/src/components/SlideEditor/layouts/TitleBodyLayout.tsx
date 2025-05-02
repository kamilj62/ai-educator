<<<<<<< HEAD
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
import type { Slide, ImageService, SlideImage } from '../types';
=======
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
>>>>>>> dd7ecbd (added imagen images)

interface TitleBodyLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
<<<<<<< HEAD
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

=======
}

const TitleBodyLayout = ({ slide, onChange, onImageUpload }: TitleBodyLayoutProps) => {
>>>>>>> dd7ecbd (added imagen images)
  const handleTitleChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title: content,
      },
    });
  };

<<<<<<< HEAD
  const handleImageChange = (image: SlideImage) => {
=======
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
>>>>>>> dd7ecbd (added imagen images)
    onChange({
      ...slide,
      content: {
        ...slide.content,
        image: {
<<<<<<< HEAD
          ...image,
          prompt: image.prompt || slide.content.title || 'Educational illustration'
=======
          url: imageUrl,
          alt: 'Slide image',
>>>>>>> dd7ecbd (added imagen images)
        },
      },
    });
  };

  return (
    <BaseLayout>
      <ContentContainer>
<<<<<<< HEAD
        <TitleContainer>
=======
        <Box>
>>>>>>> dd7ecbd (added imagen images)
          <TiptapEditor
            content={slide.content.title || ''}
            onChange={handleTitleChange}
            placeholder="Enter title..."
<<<<<<< HEAD
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
>>>>>>> dd7ecbd (added imagen images)
          )}
        </BodyContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

<<<<<<< HEAD
const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

const TitleContainer = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: theme.palette.text.primary
}));

const BodyContainer = styled(Box)(({ theme }) => ({
  fontSize: '1.25rem',
  color: theme.palette.text.secondary,
  flex: 1
}));

=======
>>>>>>> dd7ecbd (added imagen images)
export default TitleBodyLayout;
