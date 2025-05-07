import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';
import { useAppSelector } from './store/hooks';
import InputSection from './components/InputSection';
import OutlineDisplay from './components/OutlineDisplay';
import SlideEditor from './components/SlideEditor/SlideEditor';

const accentGradient = 'linear-gradient(90deg, #a855f7 10%, #6366f1 60%, #0ea5e9 100%)';

const App: React.FC = () => {
  const slides = useAppSelector(state => state.presentation.slides);
  const outline = useAppSelector(state => state.presentation.outline);
  const hasSlides = slides && slides.length > 0;
  const hasOutline = outline && outline.length > 0;

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', background: 'radial-gradient(circle at 60% 10%, #6366f1 0%, #18181b 80%)', py: 6 }}>
      <Container maxWidth="md" sx={{ height: '100%', minHeight: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: 0.5,
              lineHeight: 1.1,
              background: accentGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
              fontFamily: 'Inter, Roboto, sans-serif',
            }}
          >
            AI Presentation Generator
          </Typography>
          <Typography variant="h6" sx={{ color: '#c7d2fe', fontWeight: 400, mt: 1 }}>
            Create engaging presentations with AI-powered content generation
          </Typography>
        </Box>
        <Box>
          <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, mb: 3, borderRadius: 4, background: 'rgba(255,255,255,0.97)' }}>
            <InputSection />
          </Paper>
          {hasOutline && (
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 3, borderRadius: 4, background: 'rgba(255,255,255,0.97)' }}>
              <OutlineDisplay />
            </Paper>
          )}
          {hasSlides && (
            <Paper 
              elevation={5}
              sx={{
                p: { xs: 2, md: 4 },
                borderRadius: 4,
                background: 'rgba(255,255,255,0.99)',
                minHeight: 720,
                height: '80vh',
                maxWidth: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <SlideEditor />
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default App;
