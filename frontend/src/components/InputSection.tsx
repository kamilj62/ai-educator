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
import { generateOutline, generateSlides, selectLoading, selectError, selectOutline } from '../store/presentationSlice';
import type { SlideTopic } from './types';
import { RootState } from '../store/store';
import { InstructionalLevel } from './types';
import ErrorDisplay from './ErrorDisplay';

const InputSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const outline = useAppSelector(selectOutline) as SlideTopic[];
  const [contextInput, setContextInput] = useState('');
  const [numSlidesInput, setNumSlidesInput] = useState('5');
  const [instructionalLevelInput, setInstructionalLevelInput] = useState<InstructionalLevel>('elementary');
  const [showOutlineButton, setShowOutlineButton] = useState(false);
  const [detailedError, setDetailedError] = useState<{message: string; details?: any} | null>(null);

  const handleGenerateOutline = async () => {
    setDetailedError(null);
    
    if (!contextInput.trim() || !numSlidesInput) {
      setDetailedError({
        message: 'Please fill in all required fields',
        details: { context: contextInput, numSlides: numSlidesInput }
      });
      return;
    }

    try {
      await (dispatch as any)(generateOutline({
        topic: contextInput.trim(),
        numSlides: Number(numSlidesInput),
        instructionalLevel: instructionalLevelInput,
      })).unwrap();
      setShowOutlineButton(true);
    } catch (err) {
      console.error('Failed to generate outline:', err);
      
      const errorMessage = err?.message || 'Failed to generate outline';
      let errorDetails = null;
      
      if (err?.cause) {
        errorDetails = err.cause;
      } else if (err?.error) {
        errorDetails = err.error;
      }
      
      setDetailedError({
        message: errorMessage,
        details: errorDetails
      });
      
      console.error('Full error details:', { error: err, cause: err?.cause });
    }
  };

  const handleGenerateSlides = async () => {
    setDetailedError(null);
    
    if (!outline || outline.length === 0) {
      setDetailedError({
        message: 'Please generate an outline first',
        details: { outline }
      });
      return;
    }

    try {
      const topicsWithIds: SlideTopic[] = outline.map((topic, index) => ({
        id: topic.id || `topic-${index}`,
        title: topic.title,
        bullet_points: topic.bullet_points || [],
        description: topic.description || `A presentation about ${topic.title}`,
        image_prompt: topic.image_prompt || `An illustration representing ${topic.title}`,
        subtopics: (topic.subtopics || []).map((subtopic, subIndex) => ({
          id: subtopic.id || `subtopic-${index}-${subIndex}`,
          title: subtopic.title,
          bullet_points: subtopic.bullet_points || [],
          description: subtopic.description || `Details about ${subtopic.title}`,
          image_prompt: subtopic.image_prompt || `An illustration representing ${subtopic.title}`,
          instructionalLevel: subtopic.instructionalLevel || instructionalLevelInput
        })),
        instructionalLevel: topic.instructionalLevel || instructionalLevelInput
      }));

      await (dispatch as any)(generateSlides({
        topics: topicsWithIds,
        instructionalLevel: instructionalLevelInput,
      })).unwrap();
      
      // Reset the form after successful generation
      setContextInput('');
      setNumSlidesInput('5');
    } catch (err: any) {
      console.error('Failed to generate slides:', err);
      
      // Extract error details from the error object if available
      const errorMessage = err?.message || 'Failed to generate slides';
      let errorDetails = null;
      
      // Check for error details in the error object or its cause
      if (err?.cause) {
        errorDetails = err.cause;
      } else if (err?.error) {
        errorDetails = err.error;
      }
      
      setDetailedError({
        message: errorMessage,
        details: errorDetails
      });
      
      // Also log the full error for debugging
      console.error('Full error details:', { error: err, cause: err?.cause });
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
        Instantly create a professional presentation
      </Typography>
      {detailedError && (
        <Paper elevation={3} sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '4px solid #ef4444',
          borderRadius: 1
        }}>
          <Typography color="error" variant="subtitle2" fontWeight={600} gutterBottom>
            {detailedError.message}
          </Typography>
          {detailedError.details && (
            <Box component="pre" sx={{ 
              mt: 1, 
              p: 1, 
              fontSize: '0.75rem',
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 1,
              overflowX: 'auto',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {JSON.stringify(detailedError.details, null, 2)}
            </Box>
          )}
        </Paper>
      )}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

          {showOutlineButton && outline && outline.length > 0 && (
            <Button
              onClick={handleGenerateSlides}
              variant="outlined"
              size="large"
              disabled={loading}
              sx={{
                minHeight: 54,
                borderRadius: 3,
                fontWeight: 800,
                fontSize: '1.1rem',
                borderColor: '#6366f1',
                color: '#6366f1',
                '&:hover': {
                  borderColor: '#a855f7',
                  color: '#a855f7',
                  backgroundColor: 'rgba(168, 85, 247, 0.04)',
                },
              }}
            >
              Generate Slides from Outline
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default InputSection;
