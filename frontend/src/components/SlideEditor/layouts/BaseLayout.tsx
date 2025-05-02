import { ReactNode } from 'react';
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
  onErrorClose?: () => void;
}

const BaseLayout = ({ children, error, onErrorClose }: BaseLayoutProps) => {
  return (
    <SlideContainer>
      {error && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
          <Alert 
            severity={
              error.type === 'SAFETY_VIOLATION' ? 'error' :
              error.type === 'RATE_LIMIT' || error.type === 'QUOTA_EXCEEDED' ? 'warning' :
              error.type === 'NETWORK_ERROR' ? 'error' :
              'warning'
            }
            onClose={onErrorClose}
            sx={{ m: 1 }}
          >
            {error.message}
            {error.service && ` (${error.service})`}
            {error.retryAfter && ` - Please try again in ${error.retryAfter} seconds`}
          </Alert>
        </Box>
      )}
      {children}
    </SlideContainer>
  );
=======
}

const BaseLayout = ({ children }: BaseLayoutProps) => {
  return <SlideContainer>{children}</SlideContainer>;
>>>>>>> dd7ecbd (added imagen images)
};

export default BaseLayout;
