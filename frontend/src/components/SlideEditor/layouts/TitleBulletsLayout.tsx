<<<<<<< HEAD
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import type { Slide } from '../types';
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

const BulletsContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  gap: theme.spacing(4),
}));

const BulletList = styled(Box)(({ theme }) => ({
  flex: 1,
  '& ul': {
    margin: 0,
    paddingLeft: theme.spacing(2),
  },
}));
>>>>>>> dd7ecbd (added imagen images)

interface TitleBulletsLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
<<<<<<< HEAD
  onImageGenerate?: (prompt: string) => Promise<string>;
}

const TitleBulletsLayout: React.FC<TitleBulletsLayoutProps> = ({ 
  slide, 
  onChange,
  onImageUpload,
  onImageGenerate 
}) => {
  return (
    <BaseLayout>
      <ContentContainer>
        <BulletsContainer>
          <TitleContainer>
            {slide.content.title}
          </TitleContainer>
          <BulletList>
            {slide.content.bullets?.map((bullet, index) => (
              <BulletPoint key={index}>
                {bullet.text}
              </BulletPoint>
            ))}
          </BulletList>
          {slide.content.image?.url && (
            <ImageContainer>
              <Box
                component="img"
                src={slide.content.image.url}
                alt={slide.content.image.alt || 'Slide image'}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </ImageContainer>
=======
}

const TitleBulletsLayout = ({ slide, onChange, onImageUpload }: TitleBulletsLayoutProps) => {
  const handleTitleChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title: content,
      },
    });
  };

  const handleBulletsChange = (content: string) => {
    // Convert HTML bullet points to array
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const bullets = Array.from(tempDiv.querySelectorAll('li')).map(li => li.textContent || '');

    onChange({
      ...slide,
      content: {
        ...slide.content,
        bullets,
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

  // Convert bullet array to HTML content
  const getBulletsContent = () => {
    if (!slide.content.bullets?.length) return '';
    return `<ul>${slide.content.bullets.map(bullet => `<li>${bullet}</li>`).join('')}</ul>`;
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
        <BulletsContainer>
          <BulletList>
            <TiptapEditor
              content={getBulletsContent()}
              onChange={handleBulletsChange}
              placeholder="Enter bullet points..."
            />
          </BulletList>
          {slide.layout === 'title-bullets-image' && (
            <Box width="40%">
              <ImageUploader
                imageUrl={slide.content.image?.url}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
              />
            </Box>
>>>>>>> dd7ecbd (added imagen images)
          )}
        </BulletsContainer>
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
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  gap: theme.spacing(2)
}));

const BulletsContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

const TitleContainer = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: theme.palette.text.primary
}));

const BulletList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}));

const BulletPoint = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  color: theme.palette.text.secondary,
  '&:before': {
    content: '"•"',
    marginRight: theme.spacing(1)
  }
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '200px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper
}));

=======
>>>>>>> dd7ecbd (added imagen images)
export default TitleBulletsLayout;
