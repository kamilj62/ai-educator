import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { Slide, SlideTopic, SlideLayout, InstructionalLevel } from '../components/types';
import { RootState } from './store';

// API Configuration
const API_BASE_URL = 'http://localhost:8005';
const API_ENDPOINTS = {
  generateOutline: '/generate/outline',
  generateSlides: '/generate/slide',
  generateImage: '/api/test-image-generation',
  export: '/export'
};

export type ExportFormat = 'pdf' | 'google_slides' | 'pptx';

interface PresentationState {
  outline: SlideTopic[];
  slides: Slide[];
  activeSlideId: string | null;
  isGeneratingSlides: boolean;
  isGeneratingOutline: boolean;
  error: string | null;
  instructionalLevel: InstructionalLevel;
  defaultLayout: SlideLayout;
}

const initialState: PresentationState = {
  outline: [],
  slides: [],
  activeSlideId: null,
  isGeneratingSlides: false,
  isGeneratingOutline: false,
  error: null,
  instructionalLevel: 'high_school',
  defaultLayout: 'TITLE_BULLETS',
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ai-powerpoint-f44a1d57b590.herokuapp.com/api';

export const generateOutline = createAsyncThunk(
  'presentation/generateOutline',
  async (params: {
    topic: string;
    numSlides: number;
    instructionalLevel: InstructionalLevel;
  }) => {
    try {
<<<<<<< HEAD
      const requestBody = {
        context: params.topic,
        num_slides: params.numSlides,
        instructional_level: params.instructionalLevel,
      };

      const response = await fetch(`${API_BASE_URL}/generate/outline`, {
=======
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.generateOutline}`, {
>>>>>>> dd7ecbd (added imagen images)
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
<<<<<<< HEAD
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return (Array.isArray(data.topics) ? data.topics : [data.topics]).map((topic: any) => ({
        id: uuidv4(),
        title: typeof topic === 'string' ? topic : topic.title,
        key_points: Array.isArray(topic.key_points) ? topic.key_points : [],
        image_prompt: topic.image_prompt || '',
        description: topic.description || ''
      }));
=======
        credentials: 'include',  // Include credentials for CORS
        body: JSON.stringify({
          context: input.context,
          num_slides: input.num_slides,
          instructional_level: input.instructional_level
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        
        // Map to our custom error types from memory
        let errorMessage = 'An unexpected error occurred';
        if (errorData.error_type) {
          switch (errorData.error_type) {
            case 'RATE_LIMIT':
              errorMessage = `Rate limit exceeded. Please try again in ${errorData.retry_after} seconds.`;
              break;
            case 'QUOTA_EXCEEDED':
              errorMessage = 'API quota exceeded. Please try again later.';
              break;
            case 'SAFETY_VIOLATION':
              errorMessage = 'Content safety violation detected. Please modify your request.';
              break;
            case 'INVALID_REQUEST':
              errorMessage = errorData.detail || 'Invalid request parameters.';
              break;
            case 'API_ERROR':
              errorMessage = 'API service error. Please try again later.';
              break;
            case 'NETWORK_ERROR':
              errorMessage = 'Network connection error. Please check your connection.';
              break;
            default:
              errorMessage = errorData.detail || 'Server error occurred.';
          }
        }
        return rejectWithValue(errorMessage);
      }

      const data = await response.json();
      if (!data.topics) {
        return rejectWithValue('Invalid response format from server');
      }

      return {
        topics: data.topics,
        instructional_level: input.instructional_level,
        num_slides: input.num_slides,
        slides: []
      };
>>>>>>> dd7ecbd (added imagen images)
    } catch (error) {
      throw error;
    }
  }
);

export const generateSlides = createAsyncThunk(
  'presentation/generateSlides',
  async (topics: SlideTopic[], { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const instructionalLevel: InstructionalLevel = state.presentation.instructionalLevel;
      const defaultLayout: SlideLayout = state.presentation.defaultLayout;
      const slides: Slide[] = [];
      for (const topic of topics) {
        const requestBody = {
          topic,
          instructional_level: instructionalLevel,
          layout: defaultLayout,
        };
        const response = await fetch(`${API_BASE_URL}/generate/slides`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        slides.push(data);
      }
      return slides;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate slides');
    }
  }
);

const presentationSlice = createSlice({
  name: 'presentation',
  initialState,
  reducers: {
    setSlides(state, action: PayloadAction<Slide[]>) {
      state.slides = action.payload;
    },
    updateOutline(state, action: PayloadAction<SlideTopic[]>) {
      state.outline = action.payload;
    },
    setActiveSlide(state, action: PayloadAction<string | null>) {
      state.activeSlideId = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setInstructionalLevel(state, action: PayloadAction<InstructionalLevel>) {
      state.instructionalLevel = action.payload;
    },
    setDefaultLayout(state, action: PayloadAction<SlideLayout>) {
      state.defaultLayout = action.payload;
    },
    reorderSlides(state, action: PayloadAction<{ from: number; to: number }>) {
      const { from, to } = action.payload;
      const slide = state.slides.splice(from, 1)[0];
      state.slides.splice(to, 0, slide);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateOutline.pending, (state) => {
        state.isGeneratingOutline = true;
        state.error = null;
      })
      .addCase(generateOutline.fulfilled, (state, action) => {
        state.isGeneratingOutline = false;
        state.outline = action.payload;
        state.error = null;
      })
      .addCase(generateOutline.rejected, (state, action) => {
        state.isGeneratingOutline = false;
        state.error = action.error.message || 'Failed to generate outline';
      })
      .addCase(generateSlides.pending, (state) => {
        state.isGeneratingSlides = true;
        state.error = null;
      })
      .addCase(generateSlides.fulfilled, (state, action) => {
        state.slides = action.payload;
        state.isGeneratingSlides = false;
      })
      .addCase(generateSlides.rejected, (state, action) => {
        state.isGeneratingSlides = false;
        state.error = action.payload as string || 'Failed to generate slides';
      });
  },
});

export const {
  setSlides,
  updateOutline,
  setActiveSlide,
  setError,
  setInstructionalLevel,
  setDefaultLayout,
  reorderSlides,
} = presentationSlice.actions;

export default presentationSlice.reducer;

export const selectOutline = (state: RootState) => state.presentation.outline;
export const selectSlides = (state: RootState) => state.presentation.slides;
export const selectActiveSlideId = (state: RootState) => state.presentation.activeSlideId;
export const selectActiveSlide = (state: RootState) => {
  const activeId = state.presentation.activeSlideId;
  return activeId ? state.presentation.slides.find(s => s.id === activeId) : null;
};
export const selectDefaultLayout = (state: RootState) => state.presentation.defaultLayout;
