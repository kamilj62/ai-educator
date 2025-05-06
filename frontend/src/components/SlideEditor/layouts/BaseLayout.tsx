import React from 'react';
import { ReactNode } from 'react';
<<<<<<< HEAD
import { Box, styled, Alert, Paper } from '@mui/material';

interface BaseLayoutProps {
  children: ReactNode;
  error?: string | null;
=======
<<<<<<< HEAD
import { Box, styled, Alert } from '@mui/material';
import type { APIError } from '../../../store/presentationSlice';

const SlideContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '960px',  // Standard 16:9 width
  height: 'calc(960px * 9/16)',  // 16:9 aspect ratio
=======
import { Box, styled } from '@mui/material';

const SlideContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
>>>>>>> dd7ecbd (added imagen images)
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(4),
  backgroundColor: '#ffffff',
  borderRadius: theme.spacing(1),
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
<<<<<<< HEAD
  position: 'relative',
  overflow: 'auto',
  margin: '0 auto',
  '@media (max-width: 1200px)': {
    width: '100%',
    height: 'calc(100vw * 9/16)',
    maxHeight: 'calc(100vh - 200px)',
  },
=======
>>>>>>> dd7ecbd (added imagen images)
}));

interface BaseLayoutProps {
  children: ReactNode;
<<<<<<< HEAD
  error?: APIError | null;
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
  onErrorClose?: () => void;
  backgroundColor?: string;
  fontColor?: string;
}

const BaseLayout = ({ children, error, onErrorClose, backgroundColor, fontColor }: BaseLayoutProps) => {
  return (
    <Paper
      elevation={5}
      sx={{
        aspectRatio: '16/9',
        width: '100vw',
        maxWidth: '100vw',
        height: '100%',
        margin: 0,
        borderRadius: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: backgroundColor || ((theme) => theme.palette.background.paper),
        color: fontColor || 'inherit',
      }}
    >
      <Box
        sx={{
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
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
      </Box>
    </Paper>
  );
=======
}

const BaseLayout = ({ children }: BaseLayoutProps) => {
  return <SlideContainer>{children}</SlideContainer>;
>>>>>>> dd7ecbd (added imagen images)
};

export default BaseLayout;
