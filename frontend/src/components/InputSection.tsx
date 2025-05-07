import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Typography,
  SelectChangeEvent,
  Paper,
  InputAdornment
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { generateOutline, selectLoading, selectError, selectOutline } from '../store/presentationSlice';
import { RootState } from '../store/store';
import { InstructionalLevel } from './types';
import ErrorDisplay from './ErrorDisplay';

const InputSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const outline = useAppSelector(selectOutline);

  const [contextInput, setContextInput] = useState('');
  const [numSlidesInput, setNumSlidesInput] = useState('5');
  const [instructionalLevelInput, setInstructionalLevelInput] = useState<InstructionalLevel>('elementary');

  const handleGenerateOutline = async () => {
    if (!contextInput.trim() || !numSlidesInput) {
      console.error('Please fill in all required fields');
      return;
    }
    try {
      const outgoingPayload = {
        topic: contextInput.trim(),
        numSlides: Number(numSlidesInput),
        instructionalLevel: (instructionalLevelInput as string) === 'elementary_school' ? 'elementary' : instructionalLevelInput,
      };
      console.log('DEBUG: Outline request payload', outgoingPayload);
      await (dispatch as any)(generateOutline(outgoingPayload)).unwrap();
      setContextInput('');
      setNumSlidesInput('5');
    } catch (err) {
      console.error('Failed to generate outline:', err);
    }
  };

  const handleLevelChange = (event: SelectChangeEvent<InstructionalLevel>) => {
    setInstructionalLevelInput(event.target.value as InstructionalLevel);
  };

  return (
    <Paper elevation={6} sx={{
      p: { xs: 3, md: 4 },
      borderRadius: 5,
      background: 'rgba(24,24,27,0.75)',
      boxShadow: '0 8px 32px 0 rgba(99,102,241,0.12)',
      backdropFilter: 'blur(8px)',
      border: '1.5px solid rgba(99,102,241,0.18)',
      maxWidth: 480,
      mx: 'auto',
    }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2, letterSpacing: 0.5, textAlign: 'center', color: '#fff' }}>
        <span style={{ color: '#fff' }}>Generate Presentation</span>
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: '#a5b4fc', fontWeight: 500 }}>
        Instantly create a professional outline for your slides
      </Typography>
      <ErrorDisplay error={error} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Context"
          value={contextInput}
          onChange={(e) => setContextInput(e.target.value)}
          fullWidth
          required
          InputProps={{
            sx: { borderRadius: 3, background: 'rgba(36,37,41,0.85)', color: '#fff', input: { color: '#fff' } },
            startAdornment: <InputAdornment position="start">📝</InputAdornment>
          }}
          InputLabelProps={{ style: { color: '#a5b4fc' } }}
        />
        <TextField
          label="Number of Slides"
          type="number"
          value={numSlidesInput}
          onChange={(e) => setNumSlidesInput(e.target.value)}
          inputProps={{ min: 1, max: 20 }}
          fullWidth
          required
          InputProps={{
            sx: { borderRadius: 3, background: 'rgba(36,37,41,0.85)', color: '#fff', input: { color: '#fff' } },
            startAdornment: <InputAdornment position="start">#</InputAdornment>
          }}
          InputLabelProps={{ style: { color: '#a5b4fc' } }}
        />
        <FormControl fullWidth>
          <InputLabel sx={{ color: '#a5b4fc' }}>Instructional Level</InputLabel>
          <Select
            value={instructionalLevelInput}
            onChange={handleLevelChange}
            label="Instructional Level"
            sx={{ borderRadius: 3, background: 'rgba(36,37,41,0.85)', color: '#fff', '.MuiSelect-icon': { color: '#a5b4fc' } }}
          >
            <MenuItem value="elementary">Elementary School</MenuItem>
            <MenuItem value="middle_school">Middle School</MenuItem>
            <MenuItem value="high_school">High School</MenuItem>
            <MenuItem value="university">University</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
          </Select>
        </FormControl>
        <Button
          onClick={handleGenerateOutline}
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            minHeight: 54,
            borderRadius: 3,
            fontWeight: 800,
            fontSize: '1.1rem',
            background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)',
            boxShadow: '0 2px 16px 0 #6366f188',
            textTransform: 'none',
            letterSpacing: 0.5,
            transition: 'box-shadow 0.2s, transform 0.2s',
            '&:hover': {
              background: 'linear-gradient(90deg, #6366f1 10%, #a855f7 80%)',
              boxShadow: '0 4px 24px 0 #6366f1cc',
              transform: 'scale(1.03)',
            },
          }}
          startIcon={<RocketLaunchIcon sx={{ fontSize: 28 }} />}
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Generating...
            </>
          ) : (
            'Generate Outline'
          )}
        </Button>
      </Box>
    </Paper>
  );
};

export default InputSection;
