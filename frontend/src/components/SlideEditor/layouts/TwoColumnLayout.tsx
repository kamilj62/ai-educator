import React from 'react';
import { Box, styled } from '@mui/material';
import BaseLayout from './BaseLayout';

const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
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

interface TwoColumnLayoutProps {
  slide: any;
  onChange: (slide: any) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: string) => Promise<any>;
}

const ensureHtml = (value: string | undefined) => {
  if (!value) return '';
  if (typeof value !== 'string') return '';
  return value.trim().startsWith('<') ? value : `<p>${value}</p>`;
};

const ensureBulletsHtml = (value: string | undefined) => {
  if (!value) return '';
  if (typeof value !== 'string') return '';
  // If already HTML, return as is
  if (value.trim().startsWith('<')) return value;
  // Otherwise, wrap each line in <li>
  const items = value.split('\n').map(line => line.trim()).filter(Boolean);
  return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
};

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ 
  slide, 
  onChange,
  onImageUpload,
  onImageGenerate
}) => {
  return (
    <BaseLayout>
      <ContentContainer>
        <ColumnsContainer>
          <LeftColumn>
            {slide.content.columnLeft && typeof slide.content.columnLeft === 'string' ? (
              <span
                style={{fontSize: '1.25rem', color: '#222'}}
                dangerouslySetInnerHTML={{ __html: ensureHtml(slide.content.columnLeft) }}
              />
            ) : (
              <span style={{ color: '#bbb' }}>[No Left Column]</span>
            )}
          </LeftColumn>
          <RightColumn>
            {slide.content.columnRight && typeof slide.content.columnRight === 'string' ? (
              <span
                style={{fontSize: '1.25rem', color: '#222'}}
                dangerouslySetInnerHTML={{ __html: ensureBulletsHtml(slide.content.columnRight) }}
              />
            ) : (
              <span style={{ color: '#bbb' }}>[No Right Column]</span>
            )}
          </RightColumn>
        </ColumnsContainer>
      </ContentContainer>
    </BaseLayout>
  );
};

export default TwoColumnLayout;
