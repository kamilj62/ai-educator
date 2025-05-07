import React from 'react';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import BaseLayout from './BaseLayout';
import type { Slide } from '../../types';

const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  fontSize: '3.2rem',
  fontWeight: 700,
  color: theme.palette.text.primary,
  textAlign: 'center',
  letterSpacing: '-0.04em',
  lineHeight: 1.1,
  margin: 0,
}));

interface TitleOnlyLayoutProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
}

const TitleOnlyLayout: React.FC<TitleOnlyLayoutProps> = ({ slide, onChange }) => {
  return (
    <BaseLayout>
      <ContentContainer>
        <TitleContainer>
          {slide.content.title}
        </TitleContainer>
        {/* No subtitle, body, bullets, or image for title-only */}
      </ContentContainer>
    </BaseLayout>
  );
};

export default TitleOnlyLayout;
