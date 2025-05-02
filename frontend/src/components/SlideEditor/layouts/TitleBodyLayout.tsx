import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
<<<<<<< HEAD
import type { Slide, ImageService, SlideImage } from '../types';
=======
import type { Slide, SlideImage, ImageService } from '../types';

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  height: '100%',
  padding: theme.spacing(4),
  '& .ProseMirror': {
    '&:focus': {
      outline: 'none',
    },
  },
  '& .title-editor': {
    '& .ProseMirror': {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: theme.palette.text.primary,
      lineHeight: 1.2,
      marginBottom: theme.spacing(2),
    },
  },
}));

const BodyContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  gap: theme.spacing(4),
  minHeight: 0,
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
>>>>>>> d07ba51 (Fix layout type errors and unify BackendSlideLayout conversions)

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
<<<<<<< HEAD
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
            <ImageContainer>
              <ImageUploader
                image={slide.content.image?.url}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
                onImageGenerate={onImageGenerate}
              />
            </ImageContainer>
>>>>>>> d07ba51 (Fix layout type errors and unify BackendSlideLayout conversions)
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
