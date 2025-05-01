import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';
import App from '../src/App';
<<<<<<< HEAD
import { Box, Button, Typography, Stack, Chip } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useRouter } from 'next/router';

const accentGradient = 'linear-gradient(90deg, #a855f7 10%, #6366f1 60%, #0ea5e9 100%)';

const features = [
  'AI-powered outline & content',
  'Instant slide generation',
  'Modern, beautiful themes',
  'Export to PowerPoint or PDF',
];

const LandingPage: React.FC = () => {
  const router = useRouter();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at 60% 10%, #6366f1 0%, #18181b 80%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, Roboto, sans-serif',
      }}
    >
      {/* Main Hero Content */}
      <Box
        sx={{
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          maxWidth: 900,
          px: { xs: 2, md: 6 },
          py: 0,
          minHeight: '100vh',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '2.2rem', sm: '3.1rem', md: '3.6rem' },
            mb: 2,
            letterSpacing: 0.5,
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          Make <Box component="span" sx={{ background: accentGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>beautiful</Box> slides<br />regardless of your design experience.
        </Typography>
        <Typography variant="h6" sx={{ color: '#c7d2fe', fontWeight: 500, mb: 3, textAlign: 'center' }}>
          AI Powerpoint Generator is the fastest way to create stunning, professional presentations—no design skills required.
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{
            px: 5,
            py: 1.7,
            fontSize: '1.1rem',
            borderRadius: 3,
            fontWeight: 900,
            background: accentGradient,
            boxShadow: '0 0 32px 0 #a855f7cc',
            transition: 'box-shadow 0.3s, transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& .MuiButton-endIcon': {
              marginLeft: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            '&:hover': {
              boxShadow: '0 0 48px 0 #a855f7',
              transform: 'scale(1.045)',
              background: accentGradient,
            },
          }}
          onClick={() => router.push('/app')}
          endIcon={<RocketLaunchIcon sx={{ fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}
        >
          Get Started
        </Button>
        <Stack direction="row" spacing={4} justifyContent="center" alignItems="center" sx={{ width: '100%', mt: 4, flexWrap: 'wrap' }}>
          {features.map((feature, i) => (
            <Chip
              key={i}
              label={feature}
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.55rem' },
                background: 'rgba(99,102,241,0.24)',
                color: '#fff',
                borderRadius: 2,
                px: 4,
                py: 3,
                mb: 2,
                height: 64,
                minWidth: 220,
                maxWidth: 320,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 16px 0 #6366f188',
                textAlign: 'center',
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

const Home: React.FC = () => {
  return <LandingPage />;
};

=======

const Home: React.FC = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
export default Home;
