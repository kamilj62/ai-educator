import { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import BaseLayout from './BaseLayout';
import TiptapEditor from '../components/TiptapEditor';
import ImageUploader from '../components/ImageUploader';
import type { Slide, BulletPoint, ImageService } from '../types';

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

const BulletsContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  gap: theme.spacing(4),
  minHeight: 0,
}));

const BulletList = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  '& .ProseMirror': {
    fontSize: '1.5rem',
    color: theme.palette.text.primary,
    '& > ul': {
      margin: 0,
      padding: 0,
      listStyle: 'none',
      '& > li': {
        position: 'relative',
        paddingLeft: '1.5em',
        marginBottom: '0.75em',
        '&::before': {
          content: '"•"',
          position: 'absolute',
          left: 0,
          color: theme.palette.primary.main,
          fontSize: '1.5em',
          lineHeight: '1em',
          top: '0.1em',
        },
        '& p': {
          margin: 0,
        },
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

interface TitleBulletsLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string) => Promise<string>;
}

const TitleBulletsLayout = ({ slide, onChange, onImageUpload, onImageGenerate }: TitleBulletsLayoutProps) => {
  const getBulletsContent = useCallback((bullets?: BulletPoint[]) => {
    if (!bullets || bullets.length === 0) return '<ul><li></li></ul>';
  
    const formattedBullets = bullets.map(bullet => {
      let text = '';
      if (typeof bullet === 'string') {
        text = bullet;
      } else if (bullet && typeof bullet === 'object') {
        text = typeof bullet.text === 'string' ? bullet.text : String(bullet.text || '');
      }
      return text.trim();
    }).filter(Boolean);

    if (formattedBullets.length === 0) return '<ul><li></li></ul>';

    return `<ul>${formattedBullets.map(text => `<li>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('')}</ul>`;
  }, []);

  const handleBulletsChange = useCallback((content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const bullets: BulletPoint[] = Array.from(doc.querySelectorAll('li')).map(li => ({
      text: li.textContent || ''
    })).filter(bullet => bullet.text.trim() !== '');

    onChange({
      ...slide,
      content: {
        ...slide.content,
        bullets
      },
    });
  }, [slide, onChange]);

  const handleTitleChange = (content: string) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        title: content,
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
          alt: '',
          service: 'generated' as ImageService,
        },
      },
    });
  };

  return (
    <BaseLayout>
      <ContentContainer>
        <Box className="title-editor">
          <TiptapEditor
            content={slide.content.title}
            onChange={handleTitleChange}
            placeholder="Enter title..."
            bulletList={false}
          />
        </Box>
        <BulletsContainer>
          <BulletList>
            <TiptapEditor
              content={getBulletsContent(slide.content.bullets)}
              onChange={handleBulletsChange}
              placeholder="Enter bullet points..."
              bulletList
            />
          </BulletList>
          {slide.layout.includes('image') && (
            <ImageContainer>
              <ImageUploader
                imageUrl={slide.content.image?.url}
                onImageChange={handleImageChange}
                onImageUpload={onImageUpload}
                onImageGenerate={onImageGenerate}
                generatePrompt={slide.content.title}
              />
            </ImageContainer>
          )}
        </BulletsContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleBulletsLayout;
