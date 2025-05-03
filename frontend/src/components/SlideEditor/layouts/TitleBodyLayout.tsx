import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
import type { Slide, ImageService, SlideImage } from '../types';

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  height: '100%',
  gap: theme.spacing(2),
}));

const BodyContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const TextContent = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  '& .ProseMirror': {
    fontSize: '1.25rem',
    color: theme.palette.text.primary,
    lineHeight: 1.6,
    '& p': {
      margin: '0.75em 0',
      '&:first-child': {
        marginTop: 0,
      },
      '&:last-child': {
        marginBottom: 0,
      },
    },
  },
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  width: '40%',
  minWidth: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const TitleContainer = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: theme.palette.text.primary
}));

interface TitleBodyLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
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

  const handleImageGenerate = async (prompt: string, service?: ImageService): Promise<SlideImage> => {
    if (!onImageGenerate) throw new Error('onImageGenerate not provided');
    const result = await onImageGenerate(prompt, service);
    return result;
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
          {slide.content.body && slide.content.body.trim().startsWith('<') ? (
            <TiptapEditor
              content={slide.content.body}
              onChange={handleBodyChange}
              placeholder="Enter content..."
              bulletList={false}
            />
          ) : (
            <Typography sx={{ whiteSpace: 'pre-line' }}>
              {slide.content.body ?? slide.content.description}
            </Typography>
          )}
          {slide.layout.includes('image') && (
            <ImageUploader
              image={slide.content.image}
              onImageChange={handleImageChange}
              onImageUpload={onImageUpload}
              onImageGenerate={handleImageGenerate}
            />
          )}
          {slide.layout.includes('image') && (
            <>
              {console.log('TitleBodyLayout image:', slide.content.image)}
              <ImageContainer>
                {slide.content.image?.url && (
                  <img src={slide.content.image.url} alt={slide.content.image.alt || ''} style={{ maxWidth: '100%', maxHeight: 300 }} />
                )}
              </ImageContainer>
            </>
          )}
        </BodyContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleBodyLayout;
