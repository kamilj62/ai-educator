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
import type { AppDispatch } from '../store/store';
import { generateOutline, generateSlides, selectLoading, selectError, selectOutline } from '../store/presentationSlice';
import type { SlideTopic } from './types';
import { RootState } from '../store/store';
import { InstructionalLevel } from './types';
import ErrorDisplay from './ErrorDisplay';

const InputSection: React.FC = () => {
  const dispatch = useAppDispatch() as AppDispatch;
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const outline = useAppSelector(selectOutline) as SlideTopic[];
  const [contextInput, setContextInput] = useState('');
  const [numSlidesInput, setNumSlidesInput] = useState('5');
  const [instructionalLevelInput, setInstructionalLevelInput] = useState<InstructionalLevel>('elementary');
  const [detailedError, setDetailedError] = useState<{message: string; details?: any} | null>(null);

  const handleGenerateOutline = async () => {
    setDetailedError(null);
    
    // Validate input
    if (!contextInput.trim()) {
      setDetailedError({
        message: 'Please enter a topic for your presentation',
        details: { field: 'context', value: contextInput }
      });
      return;
    }
    
    if (!numSlidesInput || isNaN(Number(numSlidesInput)) || Number(numSlidesInput) < 1 || Number(numSlidesInput) > 20) {
      setDetailedError({
        message: 'Please enter a valid number of slides between 1 and 20',
        details: { field: 'numSlides', value: numSlidesInput }
      });
      return;
    }

    try {
      console.log('Starting outline generation with:', {
        topic: contextInput.trim(),
        numSlides: Number(numSlidesInput),
        instructionalLevel: instructionalLevelInput
      });
      
      // First generate the outline
      const result = await dispatch(generateOutline({
        topic: contextInput.trim(),
        numSlides: Number(numSlidesInput),
        instructionalLevel: instructionalLevelInput,
      })).unwrap();
      
      console.log('Outline generation successful, result:', result);
      
      // If outline is successfully generated, generate slides
      if (result?.topics?.length > 0) {
        console.log('Outline contains topics, proceeding to generate slides');
        await handleGenerateSlides(result.topics);
      } else {
        console.warn('Outline generated but no topics were returned');
        setDetailedError({
          message: 'Generated outline is empty',
          details: 'The outline was generated but no topics were returned. Please try again with a different topic.'
        });
      }
    } catch (err: any) {
      console.error('Failed to generate outline:', err);
      
      // Extract error information from different possible locations
      const errorMessage = err?.message || 
                          err?.error?.message || 
                          'Failed to generate outline. Please try again.';
      
      // Extract error details
      let errorDetails = null;
      
      // Check for error details in different locations
      if (err?.cause) {
        errorDetails = err.cause;
      } else if (err?.error) {
        errorDetails = err.error;
      } else if (err?.payload) {
        errorDetails = err.payload;
      }
      
      // Handle specific error cases
      if (errorDetails?.includes('rate limit')) {
        setDetailedError({
          message: 'API rate limit exceeded',
          details: 'Please wait a moment and try again. If the problem persists, try again later.'
        });
      } else if (errorDetails?.includes('API key') || errorDetails?.includes('authentication')) {
        setDetailedError({
          message: 'Authentication error',
          details: 'There was an issue with the API key. Please check your configuration and try again.'
        });
      } else {
        setDetailedError({
          message: errorMessage,
          details: errorDetails
        });
      }
      
      console.error('Full error details:', { 
        error: err, 
        cause: err?.cause,
        payload: err?.payload 
      });
    }
  };

  const handleGenerateSlides = async (outlineToUse?: SlideTopic[]) => {
    setDetailedError(null);
    
    const effectiveOutline = outlineToUse || outline;
    
    if (!effectiveOutline || effectiveOutline.length === 0) {
      const errorMsg = 'No outline available. Please generate an outline first.';
      console.error(errorMsg, { outline });
      setDetailedError({
        message: errorMsg,
        details: 'The outline is empty or missing. Please try generating the outline again.'
      });
      return;
    }

    try {
      console.log('Starting slide generation with outline:', effectiveOutline);
      
      // Create a copy of the outline with all required fields
      const topicsWithIds: SlideTopic[] = effectiveOutline.map((topic, index) => {
        // Ensure we have a valid topic
        if (!topic) {
          console.warn(`Skipping invalid topic at index ${index}`);
          return null;
        }
        
        try {
          return {
            id: topic.id || `topic-${index}`,
            title: topic.title || `Topic ${index + 1}`,
            key_points: Array.isArray(topic.key_points) && topic.key_points.length > 0 
              ? topic.key_points 
              : ['Key point 1'],
            description: topic.description || `A presentation about ${topic.title || 'this topic'}`,
            image_prompt: topic.image_prompt || `An illustration representing ${topic.title || 'this topic'}`,
            subtopics: Array.isArray(topic.subtopics) 
              ? topic.subtopics
                  .filter(subtopic => subtopic) // Filter out any null/undefined subtopics
                  .map((subtopic, subIndex) => ({
                    id: subtopic.id || `subtopic-${index}-${subIndex}`,
                    title: subtopic.title || `Subtopic ${subIndex + 1}`,
                    key_points: Array.isArray(subtopic.key_points) && subtopic.key_points.length > 0
                      ? subtopic.key_points 
                      : ['Key point 1'],
                    description: subtopic.description || `Details about ${subtopic.title || 'this subtopic'}`,
                    image_prompt: subtopic.image_prompt || `An illustration for ${subtopic.title || 'this subtopic'}`,
                    instructionalLevel: subtopic.instructionalLevel || instructionalLevelInput
                  }))
              : [],
            instructionalLevel: topic.instructionalLevel || instructionalLevelInput
          };
        } catch (topicErr) {
          console.error(`Error processing topic at index ${index}:`, topicErr);
          return null;
        }
      }).filter(Boolean); // Remove any null entries from the array
      
      if (topicsWithIds.length === 0) {
        const errorMsg = 'No valid topics found in the outline';
        console.error(errorMsg);
        setDetailedError({
          message: 'Invalid outline data',
          details: 'The outline does not contain any valid topics. Please try generating the outline again.'
        });
        return;
      }

      console.log('Generated topics for slides:', topicsWithIds);
      
      // Generate slides using the prepared topics
      // Create a properly typed parameters object
      const slideParams = {
        topics: topicsWithIds,
        instructionalLevel: instructionalLevelInput,
        defaultLayout: 'title-bullets' as const // Use a valid SlideLayout value
      };
      
      // Create a type-safe wrapper for dispatch that includes the unwrap method
      const typedDispatch = dispatch as unknown as <T>(action: any) => Promise<{ payload: T; type: string }> & {
        unwrap: () => Promise<T>;
      };
      
      // Call generateSlides with the typed dispatch and unwrap the result
      const action = generateSlides(slideParams);
      const result = await typedDispatch(action).unwrap();
      
      console.log('Successfully generated slides:', result);
      
    } catch (err: any) {
      console.error('Failed to generate slides:', err);
      
      // Extract error information from different possible locations
      const errorMessage = err?.message || 
                          err?.error?.message || 
                          'Failed to generate slides. Please try again.';
      
      // Extract error details
      let errorDetails = null;
      
      // Check for error details in different locations
      if (err?.cause) {
        errorDetails = err.cause;
      } else if (err?.error) {
        errorDetails = err.error;
      } else if (err?.payload) {
        errorDetails = err.payload;
      }
      
      // Handle specific error cases
      if (errorDetails?.includes('rate limit')) {
        setDetailedError({
          message: 'API rate limit exceeded',
          details: 'Please wait a moment and try again. If the problem persists, try again later.'
        });
      } else if (errorDetails?.includes('API key') || errorDetails?.includes('authentication')) {
        setDetailedError({
          message: 'Authentication error',
          details: 'There was an issue with the API key. Please check your configuration and try again.'
        });
      } else {
        setDetailedError({
          message: errorMessage,
          details: errorDetails
        });
      }
      
      console.error('Full error details:', { 
        error: err, 
        cause: err?.cause,
        payload: err?.payload 
      });
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
              'Generate Presentation'
            )}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default InputSection;
