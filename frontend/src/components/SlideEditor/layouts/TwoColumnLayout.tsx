import { Box, styled, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import ImageUploader from '../components/ImageUploader';
import { TiptapSlideEditor as TiptapEditor } from '../components/TiptapSlideEditor';
import type { Slide, ImageService, SlideImage } from '../types';

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
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ 
  slide, 
  onChange,
  onImageUpload,
  onImageGenerate 
}) => {
  const handleImageChange = (image: SlideImage) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        image,
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

  // Fix: Ensure correct return type for lint and never return undefined
  const handleImageGenerate = async (prompt: string, service?: ImageService): Promise<SlideImage> => {
    if (onImageGenerate) {
      try {
        const image = await onImageGenerate(prompt, service);
        handleImageChange(image);
        return image;
      } catch (error) {
        // Return a fallback SlideImage object if generation fails
        console.error('Failed to generate image:', error);
        return { url: '', alt: 'Image generation failed' } as SlideImage;
      }
    }
    // Always return a fallback SlideImage
    return { url: '', alt: 'Image generation failed' } as SlideImage;
  };

  return (
    <BaseLayout>
      <ContentContainer>
        <ColumnsContainer>
          <Column>
            <Typography variant="subtitle1">Left Column</Typography>
            <TiptapEditor
              content={slide.content.columnLeft || ''}
              onChange={handleLeftColumnChange}
              placeholder="Enter left column content..."
              type="slide"
            />
          </Column>
          <Column>
            <Typography variant="subtitle1">Right Column</Typography>
            {slide.layout === 'two-column-image' ? (
              <ImageUploader
                image={slide.content.image?.url}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
                onImageGenerate={handleImageGenerate}
              />
            ) : (
              <TiptapEditor
                content={slide.content.columnRight || ''}
                onChange={handleRightColumnChange}
                placeholder="Enter right column content..."
                type="slide"
              />
            )}
          </Column>
        </ColumnsContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TwoColumnLayout;
