import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
import type { Slide, ImageService, SlideImage } from '../types';

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
        image,
      },
    });
  };

  const getHtmlContent = (content: string | undefined): string => {
    if (!content) return '';
    if (content.startsWith('<')) return content;
    return `<p>${content}</p>`;
  };

  return (
    <BaseLayout>
      <ContentContainer>
        <TitleContainer>
          <TiptapEditor
            content={getHtmlContent(slide.content.title)}
            onChange={handleTitleChange}
            placeholder="Enter title..."
            bulletList={false}
          />
        </TitleContainer>
        <BodyContainer>
          <TiptapEditor
            content={getHtmlContent(slide.content.body ?? slide.content.description)}
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
          )}
        </BodyContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

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

export default TitleBodyLayout;
