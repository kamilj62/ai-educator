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
import { AppDispatch } from '../store/store';
import {
  generateOutline,
  selectLoading,
  selectError,
  InstructionalLevel
} from '../store/presentationSlice';

const InputSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  const [context, setContext] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [instructionalLevel, setInstructionalLevel] = useState<InstructionalLevel>('high_school');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (context.trim()) {
      try {
        await dispatch(generateOutline({
          context,
          num_slides: numSlides,
          instructional_level: instructionalLevel
        })).unwrap();
      } catch (error) {
        console.error('Failed to generate outline:', error);
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', p: 2 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Presentation Context"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        disabled={loading}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          type="number"
          label="Number of Slides"
          value={numSlides}
          onChange={(e) => setNumSlides(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
          disabled={loading}
          InputProps={{ inputProps: { min: 1, max: 20 } }}
          sx={{ width: '200px' }}
        />
        <FormControl sx={{ width: '200px' }}>
          <InputLabel>Level</InputLabel>
          <Select
            value={instructionalLevel}
            label="Level"
            onChange={(e) => setInstructionalLevel(e.target.value as InstructionalLevel)}
            disabled={loading}
          >
            <MenuItem value="elementary">Elementary School</MenuItem>
            <MenuItem value="middle_school">Middle School</MenuItem>
            <MenuItem value="high_school">High School</MenuItem>
            <MenuItem value="university">University</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading || !context.trim()}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Generating...' : 'Generate Outline'}
      </Button>
    </Box>
  );
};

export default InputSection;
