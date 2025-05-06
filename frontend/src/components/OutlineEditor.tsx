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
<<<<<<< HEAD
import { generateOutline, setError } from '../store/presentationSlice';
import type { InstructionalLevel, SlideTopic, SlideContent } from '../components/types';
=======
import { generateOutline, setError, APIError } from '../store/presentationSlice';
<<<<<<< HEAD
import { InstructionalLevel } from './SlideEditor/types';
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
=======
import type { InstructionalLevel, SlideTopic, SlideContent } from '../components/types';
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
import { LayoutSelector } from './SlideEditor/components/LayoutSelector';
import { BackendSlideLayout } from './SlideEditor/types';
import SlidePreview from './SlidePreview';
import EditDialog from './EditDialog';

interface OutlineEditorProps {
  onOutlineGenerated?: () => void;
}

const OutlineEditor: React.FC<OutlineEditorProps> = ({ onOutlineGenerated }) => {
  const dispatch = useAppDispatch();
<<<<<<< HEAD
  const error = useAppSelector(state => state.presentation.error);
  const outline = useAppSelector(state => state.presentation.outline);
  const slides = useAppSelector(state => state.presentation.slides);
=======
  const error = useAppSelector(state => state.presentation.error) as APIError | null;
<<<<<<< HEAD
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
=======
  const presentation = useAppSelector(state => state.presentation.presentation);
  const slides = useAppSelector(state => state.presentation.slides);
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
  const [topic, setTopic] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [level, setLevel] = useState<InstructionalLevel>('high_school');
  const [layout, setLayout] = useState<BackendSlideLayout>('title-bullets');
  const [isLayoutSelectorOpen, setIsLayoutSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [editingTopic, setEditingTopic] = useState<{ topic: string; index: number } | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
<<<<<<< HEAD
=======
      dispatch(setError(null));
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
    };
  }, [retryTimeout, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      return;
    }

    setIsLoading(true);
    dispatch(setError(null));

    try {
      await dispatch(generateOutline({
        topic: topic.trim(),
        numSlides: Math.max(1, Math.min(20, numSlides)),
        instructionalLevel: level,
      })).unwrap();
      onOutlineGenerated?.();
    } catch (err) {
      const errorObj = getErrorObject(err);
      if (errorObj.type === 'RATE_LIMIT' && errorObj.retryAfter) {
        const timeout = setTimeout(() => {
          setRetryTimeout(null);
          dispatch(setError(null));
<<<<<<< HEAD
        }, errorObj.retryAfter * 1000);
=======
        }, apiError.retryAfter * 1000);
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
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

  type APIErrorObject = {
    type?: string;
    retryAfter?: number;
    context?: any;
    [key: string]: any;
  };

  const getErrorObject = (err: unknown): APIErrorObject => {
    if (typeof err === 'string') return { type: 'GENERIC', message: err };
    if (typeof err === 'object' && err !== null) return err as APIErrorObject;
    return { type: 'GENERIC', message: 'Unknown error' };
  };

  const getErrorSeverity = (errorObj: APIErrorObject): 'error' | 'warning' => {
    switch (errorObj.type) {
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

  const getErrorTitle = (errorObj: APIErrorObject): string => {
    switch (errorObj.type) {
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

  const getErrorMessage = (error: unknown): string => {
    const err = getErrorObject(error);
    if (err.type === 'SAFETY_VIOLATION') {
      return `The topic "${err.context?.topic ?? ''}" contains potentially sensitive content. Please ensure your topic is appropriate for educational purposes.`;
    }
    if (err.type === 'RATE_LIMIT' && err.retryAfter) {
      return `Rate limit exceeded. Please try again in ${err.retryAfter} seconds.`;
    }
    return typeof error === 'string' ? error : err.message || 'An error occurred.';
  };

  const handleSaveTopic = (updatedTopic: SlideTopic, updatedSlide?: SlideContent) => {
    if (editingTopic && slides) {
      // Implement logic to update the slide/topic in Redux or local state
      setEditingTopic(null);
    }
  };

  const handleSaveTopic = (updatedTopic: SlideTopic, updatedSlide?: SlideContent) => {
    if (editingTopic && slides) {
      // Implement logic to update the slide/topic in Redux or local state
      setEditingTopic(null);
    }
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
<<<<<<< HEAD
          severity={getErrorSeverity(getErrorObject(error))}
=======
          severity={getErrorSeverity(error.type)}
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
          onClose={() => dispatch(setError(null))}
          sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
        >
          <AlertTitle>{getErrorTitle(getErrorObject(error))}</AlertTitle>
          {getErrorMessage(error)}
          {getErrorObject(error).retryAfter && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please try again in {getErrorObject(error).retryAfter} seconds.
            </Typography>
          )}
        </Alert>
      )}

      {/* Right side - Slide Preview */}
      <Box sx={{ width: '50%' }}>
        {slides && slides.length > 0 && (
          <SlidePreview
            slides={slides}
            currentIndex={currentSlideIndex}
            onPrevious={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            onNext={() => setCurrentSlideIndex(Math.min((slides?.length ?? 1) - 1, currentSlideIndex + 1))}
          />
        )}
      </Box>

      {/* Edit Dialog */}
      {editingTopic && slides && (
        <EditDialog
          open={true}
          topic={{
            id: slides[editingTopic.index]?.id || '',
            title: slides[editingTopic.index]?.content?.title || '',
            key_points: [],
            description: slides[editingTopic.index]?.content?.body || '',
          }}
          slide={slides[editingTopic.index]?.content}
          onClose={() => setEditingTopic(null)}
          onSave={(topic, slideContent) => handleSaveTopic(topic, slideContent)}
        />
      )}

      <TextField
        fullWidth
        label="Topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        margin="normal"
        required
        error={getErrorObject(error).type === 'SAFETY_VIOLATION'}
        helperText={getErrorObject(error).type === 'SAFETY_VIOLATION' ? getErrorMessage(error) : ''}
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
          id: 'preview-topic',
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
