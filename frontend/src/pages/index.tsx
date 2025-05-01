import React from 'react';
import { Container, Paper, Typography, Box, Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { selectOutline } from '../store/presentationSlice';
<<<<<<< HEAD
import { Presentation } from '../components/types';
=======
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
import InputSection from '../components/InputSection';
import OutlineEditor from '../components/OutlineEditor';
import OutlineDisplay from '../components/OutlineDisplay';
import ErrorDisplay from '../components/ErrorDisplay';

const Home: React.FC = () => {
  const error = useSelector((state: RootState) => state.presentation.error);
  const outline = useSelector(selectOutline);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        MarvelAI Presentation Generator
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          {error && (
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <ErrorDisplay error={error} />
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <InputSection />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <OutlineEditor />
          </Paper>
        </Grid>

        {outline?.length > 0 && (
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
              <OutlineDisplay />
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Home;
