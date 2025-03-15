import { ReactNode } from 'react';
import { Box, styled } from '@mui/material';

const SlideContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(4),
  backgroundColor: '#ffffff',
  borderRadius: theme.spacing(1),
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
}));

interface BaseLayoutProps {
  children: ReactNode;
}

const BaseLayout = ({ children }: BaseLayoutProps) => {
  return <SlideContainer>{children}</SlideContainer>;
};

export default BaseLayout;
