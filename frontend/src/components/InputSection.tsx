import React from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, Button, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { generateOutline } from '../store/presentationSlice';

type InstructionalLevel = 'elementary' | 'middle_school' | 'high_school' | 'university' | 'professional';

interface PresentationInput {
  context: string;
  num_slides: number;
  instructional_level: InstructionalLevel;
}

const InputSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [input, setInput] = React.useState<PresentationInput>({
    context: '',
    num_slides: 5,
    instructional_level: 'high_school'
  });
  const { loading, error } = useSelector((state: RootState) => state.presentation);

  const handleInputChange = (field: keyof PresentationInput, value: string | number) => {
    setInput(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateOutline = async () => {
    try {
      await dispatch(generateOutline(input)).unwrap();
    } catch (err) {
      console.error('Failed to generate outline:', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <TextField
        fullWidth
        label="Presentation Context"
        multiline
        rows={4}
        value={input.context}
        onChange={(e) => handleInputChange('context', e.target.value)}
        placeholder="Enter your presentation topic or description..."
        error={!!error}
        helperText={error}
      />
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Number of Slides</InputLabel>
          <Select
            value={input.num_slides}
            label="Number of Slides"
            onChange={(e) => handleInputChange('num_slides', Number(e.target.value))}
          >
            {[5, 10, 15, 20].map((num) => (
              <MenuItem key={num} value={num}>
                {num} slides
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Educational Level</InputLabel>
          <Select
            value={input.instructional_level}
            label="Educational Level"
            onChange={(e) => handleInputChange('instructional_level', e.target.value as InstructionalLevel)}
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
        variant="contained"
        color="primary"
        onClick={handleGenerateOutline}
        disabled={loading || !input.context.trim()}
      >
        {loading ? 'Generating...' : 'Generate Outline'}
      </Button>
    </Box>
  );
};

export default InputSection;
