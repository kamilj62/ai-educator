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
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { generateOutline, selectPresentation, selectLoading, selectError } from '../store/presentationSlice';
import { RootState } from '../store/store';
import type { InstructionalLevel } from '../components/SlideEditor/types';
import { AppDispatch } from '../store/store';

const InputSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const presentation = useSelector(selectPresentation);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  const [contextInput, setContextInput] = useState('');
  const [numSlidesInput, setNumSlidesInput] = useState('5');
  const [instructionalLevelInput, setInstructionalLevelInput] = useState<InstructionalLevel>('elementary_school');

  const handleGenerateOutline = async () => {
    if (!contextInput.trim() || !numSlidesInput) {
      console.error('Please fill in all required fields');
      return;
    }
    try {
      await dispatch(generateOutline({
        topic: contextInput.trim(),
        numSlides: Number(numSlidesInput),
        instructionalLevel: instructionalLevelInput,
      })).unwrap();
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
    <Box component="form" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Generate Presentation
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Context"
          value={contextInput}
          onChange={(e) => setContextInput(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Number of Slides"
          type="number"
          value={numSlidesInput}
          onChange={(e) => setNumSlidesInput(e.target.value)}
          inputProps={{ min: 1, max: 20 }}
          fullWidth
          required
        />
        <FormControl fullWidth>
          <InputLabel>Instructional Level</InputLabel>
          <Select
            value={instructionalLevelInput}
            onChange={handleLevelChange}
            label="Instructional Level"
          >
            <MenuItem value="elementary_school">Elementary School</MenuItem>
            <MenuItem value="middle_school">Middle School</MenuItem>
            <MenuItem value="high_school">High School</MenuItem>
            <MenuItem value="university">University</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
          </Select>
        </FormControl>
        <Button
          onClick={handleGenerateOutline}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 150 }}
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
    </Box>
  );
};

export default InputSection;
