import React from 'react';
import { ReactNode } from 'react';
import { Box, styled, Alert } from '@mui/material';

const SlideContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '960px',  // Standard 16:9 width
  height: '540px',  // 16:9 aspect ratio (960 * 9/16)
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  position: 'relative',
  overflow: 'hidden', // Changed from 'auto' to 'hidden' to prevent double scrollbars
  margin: '0 auto',
  '@media (max-width: 1200px)': {
    width: '100%',
    height: 'calc(100vh - 200px)',
    maxHeight: 'none',
  },
  '& > div': {
    height: '100%',
    overflowY: 'auto', // Add scroll to inner content
    paddingRight: theme.spacing(1), // Space for scrollbar
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: theme.palette.grey[100],
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.grey[400],
      borderRadius: '4px',
      '&:hover': {
        background: theme.palette.grey[500],
      },
    },
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
