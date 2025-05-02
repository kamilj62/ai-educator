import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import type { Slide } from '../types';

interface TitleBulletsLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
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
          )}
        </BulletsContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

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

export default TitleBulletsLayout;
