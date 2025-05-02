<<<<<<< HEAD
import { Box, styled, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import ImageUploader from '../components/ImageUploader';
import type { Slide, SlideImage } from '../types';
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
}));
>>>>>>> dd7ecbd (added imagen images)

interface TwoColumnLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
<<<<<<< HEAD
  onImageGenerate?: (prompt: string) => Promise<string>;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ 
  slide, 
  onChange,
  onImageUpload,
  onImageGenerate 
}) => {
  const handleImageChange = (image: SlideImage) => {
=======
}

const TwoColumnLayout = ({ slide, onChange, onImageUpload }: TwoColumnLayoutProps) => {
  const handleTitleChange = (content: string) => {
>>>>>>> dd7ecbd (added imagen images)
    onChange({
      ...slide,
      content: {
        ...slide.content,
<<<<<<< HEAD
        image
      }
=======
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
          alt: 'Slide image',
        },
      },
>>>>>>> dd7ecbd (added imagen images)
    });
  };

  return (
    <BaseLayout>
      <ContentContainer>
<<<<<<< HEAD
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
=======
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
            {slide.layout === 'two-column-image' ? (
              <ImageUploader
                imageUrl={slide.content.image?.url}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
              />
            ) : (
              <TiptapEditor
                content={slide.content.columnRight || ''}
                onChange={handleRightColumnChange}
                placeholder="Enter right column content..."
              />
            )}
          </Column>
>>>>>>> dd7ecbd (added imagen images)
        </ColumnsContainer>
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

=======
>>>>>>> dd7ecbd (added imagen images)
export default TwoColumnLayout;
