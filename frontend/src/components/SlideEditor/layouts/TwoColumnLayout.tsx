import { Box, styled, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import ImageUploader from '../components/ImageUploader';
import type { Slide, SlideImage } from '../types';

interface TwoColumnLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string) => Promise<string>;
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
        image
      }
    });
  };

  return (
    <BaseLayout>
      <ContentContainer>
        <TitleContainer>
          {slide.content.title}
        </TitleContainer>
        <ColumnsContainer>
          <LeftColumn>
            {slide.content.body}
          </LeftColumn>
          <RightColumn>
            <ImageUploader
              currentImage={slide.content.image}
              onImageChange={handleImageChange}
              onImageUpload={onImageUpload}
              onImageGenerate={onImageGenerate}
              maxWidth={1920}
              maxHeight={1080}
            />
          </RightColumn>
        </ColumnsContainer>
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

const ColumnsContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  gap: theme.spacing(4)
}));

const LeftColumn = styled(Box)(({ theme }) => ({
  flex: 1,
  fontSize: '1.25rem',
  color: theme.palette.text.secondary
}));

const RightColumn = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start'
}));

export default TwoColumnLayout;
