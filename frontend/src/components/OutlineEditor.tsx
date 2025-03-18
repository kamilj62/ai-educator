import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { generateOutline, selectError, clearError, InstructionalLevel, APIError } from '../store/presentationSlice';
import { LayoutSelector } from './SlideEditor/components/LayoutSelector';
import { BackendSlideLayout } from './SlideEditor/types';

interface OutlineEditorProps {
  onOutlineGenerated?: () => void;
}

const OutlineEditor: React.FC<OutlineEditorProps> = ({ onOutlineGenerated }) => {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectError) as APIError | null;
  const [topic, setTopic] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [level, setLevel] = useState<InstructionalLevel>('high_school');
  const [layout, setLayout] = useState<BackendSlideLayout>('title-bullets');
  const [isLayoutSelectorOpen, setIsLayoutSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      dispatch(clearError());
    };
  }, [retryTimeout, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      return;
    }

    setIsLoading(true);
    dispatch(clearError());

    try {
      await dispatch(generateOutline({
        topic: topic.trim(),
        numSlides: Math.max(1, Math.min(20, numSlides)),
        instructionalLevel: level,
      })).unwrap();
      onOutlineGenerated?.();
    } catch (err) {
      const apiError = err as APIError;
      if (apiError?.type === 'RATE_LIMIT' && apiError?.retryAfter) {
        const timeout = setTimeout(() => {
          setRetryTimeout(null);
          dispatch(clearError());
        }, apiError.retryAfter * 1000);
        setRetryTimeout(timeout);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLayoutSelect = (selectedLayout: BackendSlideLayout) => {
    setLayout(selectedLayout);
    setIsLayoutSelectorOpen(false);
  };

  const getErrorSeverity = (errorType?: string): 'error' | 'warning' => {
    switch (errorType) {
      case 'SAFETY_VIOLATION':
      case 'NETWORK_ERROR':
        return 'error';
      case 'RATE_LIMIT':
      case 'QUOTA_EXCEEDED':
        return 'warning';
      default:
        return 'warning';
    }
  };

  const getErrorTitle = (errorType?: string): string => {
    switch (errorType) {
      case 'RATE_LIMIT':
        return 'Rate Limit Exceeded';
      case 'QUOTA_EXCEEDED':
        return 'API Quota Exceeded';
      case 'SAFETY_VIOLATION':
        return 'Content Safety Warning';
      case 'INVALID_REQUEST':
        return 'Invalid Request';
      case 'API_ERROR':
        return 'API Error';
      case 'NETWORK_ERROR':
        return 'Network Error';
      default:
        return 'Error';
    }
  };

  const getErrorMessage = (error: APIError): string => {
    if (error.type === 'SAFETY_VIOLATION') {
      return `The topic "${error.context?.topic}" contains potentially sensitive content. Please ensure your topic is appropriate for educational purposes.`;
    }
    return error.message;
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}
    >
      <Typography variant="h5" gutterBottom>
        Generate Presentation Outline
      </Typography>

      {error && (
        <Alert 
          severity={getErrorSeverity(error.type)}
          onClose={() => dispatch(clearError())}
          sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
        >
          <AlertTitle>{getErrorTitle(error.type)}</AlertTitle>
          {getErrorMessage(error)}
          {error.retryAfter && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please try again in {error.retryAfter} seconds.
            </Typography>
          )}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        margin="normal"
        required
        error={!!error && error.type === 'SAFETY_VIOLATION'}
        helperText={error?.type === 'SAFETY_VIOLATION' ? getErrorMessage(error) : ''}
      />

      <TextField
        fullWidth
        type="number"
        label="Number of Slides"
        value={numSlides}
        onChange={(e) => setNumSlides(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
        margin="normal"
        inputProps={{ min: 1, max: 20 }}
        required
      />

      <FormControl 
        fullWidth 
        margin="normal"
      >
        <InputLabel>Instructional Level</InputLabel>
        <Select
          value={level}
          onChange={(e) => setLevel(e.target.value as InstructionalLevel)}
          label="Instructional Level"
          required
        >
          <MenuItem value="elementary">Elementary School</MenuItem>
          <MenuItem value="middle_school">Middle School</MenuItem>
          <MenuItem value="high_school">High School</MenuItem>
          <MenuItem value="university">University</MenuItem>
          <MenuItem value="professional">Professional</MenuItem>
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        onClick={() => setIsLayoutSelectorOpen(true)}
        sx={{ mt: 2, mb: 1 }}
        disabled={isLoading}
      >
        {layout ? `Selected Layout: ${layout}` : 'Select Layout'}
      </Button>

      <LayoutSelector
        open={isLayoutSelectorOpen}
        onClose={() => setIsLayoutSelectorOpen(false)}
        onSelect={handleLayoutSelect}
        topic={{
          title: topic || 'Untitled',
          key_points: [],
          image_prompt: topic ? `Generate an educational image for ${topic}` : undefined,
        }}
      />

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading || !!retryTimeout || !topic.trim()}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Generate'}
        </Button>
      </Box>
    </Box>
  );
};

export default OutlineEditor;
