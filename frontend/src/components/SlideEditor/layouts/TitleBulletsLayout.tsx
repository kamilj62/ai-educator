import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import type { Slide } from '../types';

interface TitleBulletsLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
}

const TitleBulletsLayout: React.FC<{
  slide: Slide;
  onChange: (slide: Slide) => void;
}> = ({ slide, onChange }) => {
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
                alt={slide.content.image.alt || ''}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  borderRadius: 1
                }}
              />
              {slide.content.image.caption && (
                <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', display: 'block' }}>
                  {slide.content.image.caption}
                </Typography>
              )}
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
  flexDirection: 'column'
}));

const BulletsContainer = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
});

const TitleContainer = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: theme.spacing(2)
}));

const BulletList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}));

const BulletPoint = styled(Typography)(({ theme }) => ({
  fontSize: '1.2rem',
  display: 'flex',
  alignItems: 'center',
  '&:before': {
    content: '"•"',
    marginRight: theme.spacing(1),
    fontSize: '1.5rem'
  }
}));

const ImageContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '1rem'
});

export default TitleBulletsLayout;
