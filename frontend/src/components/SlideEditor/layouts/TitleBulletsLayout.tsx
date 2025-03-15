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

interface TitleBulletsLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
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
          )}
        </BulletsContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleBulletsLayout;
