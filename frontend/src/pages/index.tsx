import React from 'react';
import { Container, Paper, Typography, Box, Alert } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import InputSection from '../components/InputSection';
import OutlineEditor from '../components/OutlineEditor';

const Home: React.FC = () => {
  const { error, presentation } = useSelector((state: RootState) => state.presentation);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        MarvelAI Presentation Generator
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper elevation={1}>
          <InputSection />
        </Paper>

        {presentation?.topics && presentation.topics.length > 0 && (
          <Box sx={{ flex: 1 }}>
            <Paper elevation={1}>
              <OutlineEditor />
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Home;
