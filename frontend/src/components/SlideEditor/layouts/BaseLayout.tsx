import { ReactNode } from 'react';
import { Box, styled, Alert, Paper } from '@mui/material';

interface BaseLayoutProps {
  children: ReactNode;
  error?: string | null;
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
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        margin: 0,
        borderRadius: 2,
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
};

export default BaseLayout;
