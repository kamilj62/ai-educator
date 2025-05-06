<<<<<<< HEAD
<<<<<<< HEAD
import React from 'react';
import { Box, styled } from '@mui/material';
import BaseLayout from './BaseLayout';
import type { Slide, ImageService, SlideImage } from '../types';
import TiptapEditor from '../components/TiptapEditor';

const PreviewWrapper = styled('div')(() => ({
  width: 320,
  height: 180,
  overflowX: 'auto', 
  overflowY: 'hidden',
  borderRadius: 8,
  background: '#f8f8ff', 
  boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start', 
}));

const PreviewContentContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  height: '100%',
  alignItems: 'stretch',
  justifyContent: 'stretch',
  gap: 4,
}));

const PreviewColumn = styled(Box)(() => ({
  width: '50%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  padding: 8,
  background: '#fff',
  fontSize: '0.8rem',
  overflow: 'hidden',
  boxSizing: 'border-box',
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1), 
  height: '100%',
  width: '100%',
  alignItems: 'stretch',
  justifyContent: 'stretch',
  padding: 0, 
  boxSizing: 'border-box',
  overflow: 'visible', 
}));

const Column = styled(Box)(({ theme }) => ({
  flex: 1, 
  minWidth: 0, 
  maxWidth: 'none', 
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  background: '#fff',
  borderRadius: 0,
  boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
  // border: '1px dashed #d0d', // debug - commented out
  alignItems: 'flex-start',
  fontSize: '1rem',
  padding: theme.spacing(1), 
  height: '100%', 
  boxSizing: 'border-box',
  overflow: 'visible', 
}));
=======
<<<<<<< HEAD
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
import { Box, styled, Typography } from '@mui/material';
import BaseLayout from './BaseLayout';
import ImageUploader from '../components/ImageUploader';
import type { Slide, SlideImage } from '../types';
<<<<<<< HEAD
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
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)

interface TwoColumnLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
<<<<<<< HEAD
<<<<<<< HEAD
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
  preview?: boolean;
=======
<<<<<<< HEAD
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
  onImageGenerate?: (prompt: string) => Promise<string>;
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ 
  slide, 
  onChange,
  onImageUpload,
  onImageGenerate,
  preview
}) => {
<<<<<<< HEAD
  if (preview === true) {
    // PREVIEW MODE: show static, non-editable content only
    return (
      <PreviewWrapper>
        <PreviewContentContainer>
          <PreviewColumn>
            <span
              style={{ fontWeight: 700, color: '#222', marginBottom: '0.2rem', wordBreak: 'break-word', textAlign: 'left', lineHeight: 1.1 }}
              dangerouslySetInnerHTML={{ __html: typeof slide.content.title === 'string' ? (slide.content.title.trim().startsWith('<') ? slide.content.title : `<p>${slide.content.title}</p>`) : '' }}
            />
          </PreviewColumn>
          <PreviewColumn>
            <span
              style={{ color: '#333', wordBreak: 'break-word', textAlign: 'left', lineHeight: 1.1 }}
              dangerouslySetInnerHTML={{ __html: (slide.content.bullets && typeof slide.content.bullets === 'string' && slide.content.bullets.trim()) ? (slide.content.bullets.trim().startsWith('<') ? slide.content.bullets : `<ul>${slide.content.bullets.split('\n').map(line => `<li>${line.trim()}</li>`).join('')}</ul>`) : '<span style=\'color:#bbb;font-style:italic\'>[No Bullets/Body Content]</span>' }}
            />
          </PreviewColumn>
        </PreviewContentContainer>
      </PreviewWrapper>
    );
  }
  // EDITOR MODE: show static (non-Tiptap) fields for main slide, Tiptap only in modal
  return (
    <BaseLayout>
      <ContentContainer>
        <Column>
          <span
            style={{ fontWeight: 700, color: '#222', marginBottom: '0.2rem', wordBreak: 'break-word', textAlign: 'left', lineHeight: 1.1 }}
            dangerouslySetInnerHTML={{ __html: typeof slide.content.title === 'string' ? (slide.content.title.trim().startsWith('<') ? slide.content.title : `<p>${slide.content.title}</p>`) : '' }}
          />
        </Column>
        <Column>
          <span
            style={{ color: '#333', wordBreak: 'break-word', textAlign: 'left', lineHeight: 1.1 }}
            dangerouslySetInnerHTML={{ __html: (slide.content.bullets && typeof slide.content.bullets === 'string' && slide.content.bullets.trim()) ? (slide.content.bullets.trim().startsWith('<') ? slide.content.bullets : `<ul>${slide.content.bullets.split('\n').map(line => `<li>${line.trim()}</li>`).join('')}</ul>`) : "<span style='color:#bbb;font-style:italic'>[No Bullets/Body Content]</span>" }}
          />
        </Column>
=======
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
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
      </ContentContainer>
    </BaseLayout>
  );
};

<<<<<<< HEAD
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
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

<<<<<<< HEAD
=======
>>>>>>> dd7ecbd (added imagen images)
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
=======
>>>>>>> 241cbc39 (Fix lint errors, optimize images, and clean up lockfile for Heroku deployment)
export default TwoColumnLayout;
