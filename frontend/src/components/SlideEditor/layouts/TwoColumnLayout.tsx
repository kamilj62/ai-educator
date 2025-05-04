import { Box, styled, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import BaseLayout from './BaseLayout';
import { Rnd } from 'react-rnd';
import type { Slide, ImageService, SlideImage } from '../types';

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  height: '100%',
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  minHeight: 0,
}));

interface TwoColumnLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ 
  slide, 
  onChange,
  onImageUpload,
  onImageGenerate 
}) => {
  const handleTitleChange = (title: string) => {
    onChange({
      ...slide,
      content: { ...slide.content, title },
    });
  };
  const handleBulletsChange = (bullets: string) => {
    onChange({
      ...slide,
      content: { ...slide.content, bullets },
    });
  };

  return (
    <BaseLayout>
      <ContentContainer>
        {/* NO TiptapEditor here. Only display text, not editable. */}
        <span
          style={{ fontSize: '2.2rem', fontWeight: 600, color: '#222', display: 'block', marginBottom: '1rem' }}
          dangerouslySetInnerHTML={{ __html: typeof slide.content.title === 'string' ? (slide.content.title.trim().startsWith('<') ? slide.content.title : `<p>${slide.content.title}</p>`) : '' }}
        />
        {/* NO image rendering in TwoColumnLayout (non-image layout) */}
        <span
          style={{ fontSize: '1.25rem', color: '#333', display: 'block', marginTop: '1.5rem' }}
          dangerouslySetInnerHTML={{ __html: typeof slide.content.bullets === 'string' ? (slide.content.bullets.trim().startsWith('<') ? slide.content.bullets : `<ul>${slide.content.bullets.split('\n').map(line => `<li>${line.trim()}</li>`).join('')}</ul>`) : '' }}
        />
      </ContentContainer>
    </BaseLayout>
  );
};

export default TwoColumnLayout;
