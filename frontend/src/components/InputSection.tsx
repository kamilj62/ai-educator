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
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { generateOutline, setInstructionalLevel, setDefaultLayout } from '../store/presentationSlice';
import { RootState } from '../store/store';
import type { InstructionalLevel, SlideLayout } from '../components/types';
import { layoutOptions } from '../components/SlideEditor/types';
import { AppDispatch } from '../store/store';

const InputSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const instructionalLevel = useSelector((state: RootState) => state.presentation.instructionalLevel);
  const defaultLayout = useSelector((state: RootState) => state.presentation.defaultLayout);
  const isGeneratingOutline = useSelector((state: RootState) => state.presentation.isGeneratingOutline);
  const error = useSelector((state: RootState) => state.presentation.error);

  const [topic, setTopic] = useState('');
  const [numSlides, setNumSlides] = useState('5');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !numSlides) {
      dispatch(setInstructionalLevel('high_school'));
      return;
    }
    try {
      await dispatch(generateOutline({
        topic: topic.trim(),
        numSlides: parseInt(numSlides, 10),
        instructionalLevel,
      })).unwrap();
      setTopic('');
      setNumSlides('5');
    } catch (err) {
      // Error is handled by the thunk
      console.error('Failed to generate outline:', err);
    }
  };

  const handleLevelChange = (event: any) => {
    dispatch(setInstructionalLevel(event.target.value as InstructionalLevel));
  };

  const handleLayoutChange = (event: any) => {
    dispatch(setDefaultLayout(event.target.value as SlideLayout));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Generate Presentation
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Number of Slides"
          type="number"
          value={numSlides}
          onChange={(e) => setNumSlides(e.target.value)}
          inputProps={{ min: 1, max: 20 }}
          fullWidth
          required
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Instructional Level</InputLabel>
            <Select
              value={instructionalLevel}
              onChange={handleLevelChange}
              label="Instructional Level"
            >
              <MenuItem value="elementary">Elementary School</MenuItem>
              <MenuItem value="middle_school">Middle School</MenuItem>
              <MenuItem value="high_school">High School</MenuItem>
              <MenuItem value="university">University</MenuItem>
              <MenuItem value="professional">Professional</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Default Layout</InputLabel>
            <Select
              value={defaultLayout}
              onChange={handleLayoutChange}
              label="Default Layout"
            >
              {layoutOptions.map((option) => (
                <MenuItem key={option.layout} value={option.layout}>
                  {option.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Button
          type="submit"
          variant="contained"
          disabled={isGeneratingOutline}
          sx={{ minWidth: 150 }}
        >
          {isGeneratingOutline ? (
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
