import React from 'react';
import { ReactNode } from 'react';
import { Box, styled, Alert } from '@mui/material';

const SlideContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '960px',  // Standard 16:9 width
  height: 'calc(960px * 9/16)',  // 16:9 aspect ratio
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  position: 'relative',
  overflow: 'auto',
  margin: '0 auto',
  '@media (max-width: 1200px)': {
    width: '100%',
    height: 'calc(100vw * 9/16)',
    maxHeight: 'calc(100vh - 200px)',
  },
}));

interface BaseLayoutProps {
  children: ReactNode;
  error?: string | null;
  onErrorClose?: () => void;
  backgroundColor?: string;
  fontColor?: string;
}

const BaseLayout = ({ children, error, onErrorClose, backgroundColor, fontColor }: BaseLayoutProps) => {
  return (
    <SlideContainer>
      {error && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
          <Alert 
            severity="error"
            onClose={onErrorClose}
            sx={{ m: 1 }}
          >
            {error}
          </Alert>
        </Box>
      )}
      {children}
    </SlideContainer>
  );
};

export default BaseLayout;
