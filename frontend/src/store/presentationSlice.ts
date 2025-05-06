import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Slide, SlideContent, SlideLayout, SlideImage, SlideTopic, BulletPoint, InstructionalLevel } from '../components/SlideEditor/types';
import { RootState } from './store';
import { normalizeBullets } from '../components/SlideEditor/components/utils';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const API_ENDPOINTS = {
  generateOutline: '/api/generate/outline',
  generateSlides: '/api/generate/slides',
  generateImage: '/api/test-image-generation',
  export: '/export',
};

export interface APIError {
  message: string;
  type?: 'SAFETY_VIOLATION' | 'RATE_LIMIT' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR';
  service?: string;
  retryAfter?: number;
  context?: { topic: string };
}

export interface ErrorData {
  message: string;
  context?: { topic: string };
}

interface PresentationState {
  outline: SlideTopic[];
  slides: Slide[];
  activeSlideId: string | null;
  isGeneratingSlides: boolean;
  isGeneratingOutline: boolean;
  error: APIError | null;
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
  instructionalLevel: 'elementary_school',
  defaultLayout: 'title-bullets',
};

// Async thunks
export const generateOutline = createAsyncThunk(
  'presentation/generateOutline',
  async (params: { topic: string; numSlides: number; instructionalLevel: InstructionalLevel }) => {
    try {
      const requestBody = {
        context: params.topic,
        num_slides: params.numSlides,
        instructional_level: params.instructionalLevel,
      };
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.generateOutline}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        let errorPayload;
        let errorMessage = 'API Error';
        try {
          errorPayload = await response.json();
          if (typeof errorPayload === 'object' && errorPayload !== null) {
            errorMessage = errorPayload.message || errorMessage;
          }
        } catch (e2) {
          errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      // Convert topics to SlideTopic format with IDs
      const outline = (Array.isArray(data.topics) ? data.topics : [data.topics]).map((topic: any) => ({
        id: uuidv4(),
        title: typeof topic === 'string' ? topic : topic.title,
        key_points: Array.isArray(topic.key_points) ? topic.key_points : [],
        image_prompt: topic.image_prompt,
        description: topic.description,
        subtopics: topic.subtopics,
        instructionalLevel: topic.instructionalLevel,
      }));
      return outline;
    } catch (error) {
      throw error;
    }
  }
);

export const generateSlides = createAsyncThunk(
  'presentation/generateSlides',
  async (topics: SlideTopic[], { getState }) => {
    try {
      const state = getState() as RootState;
      const requestBody = {
        topics: topics,
        instructional_level: state.presentation.instructionalLevel,
        num_slides: topics.length,
        layout: state.presentation.defaultLayout,
      };
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.generateSlides}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        let errorPayload;
        let errorMessage = 'API Error';
        try {
          errorPayload = await response.json();
          if (typeof errorPayload === 'object' && errorPayload !== null) {
            errorMessage = errorPayload.message || errorMessage;
          }
        } catch (e2) {
          errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      // Map backend response to frontend Slide type
      const slides: Slide[] = (Array.isArray(data.slides) ? data.slides : [data.slides]).map((slide: any) => ({
        ...slide,
        id: slide.id || uuidv4(),
      }));
      return slides;
    } catch (error) {
      throw error;
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
    setError(state, action: PayloadAction<APIError | null>) {
      state.error = action.payload;
    },
    setInstructionalLevel(state, action: PayloadAction<InstructionalLevel>) {
      state.instructionalLevel = action.payload;
    },
    setDefaultLayout(state, action: PayloadAction<SlideLayout>) {
      state.defaultLayout = action.payload;
    },
    reorderSlides(state, action: PayloadAction<{ oldIndex: number; newIndex: number }>) {
      const { oldIndex, newIndex } = action.payload;
      const slides = [...state.slides];
      const [removed] = slides.splice(oldIndex, 1);
      slides.splice(newIndex, 0, removed);
      state.slides = slides;
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
        state.error = {
          message: action.error.message || 'Failed to generate outline',
          context: { topic: '' },
        };
      })
      .addCase(generateSlides.pending, (state) => {
        state.isGeneratingSlides = true;
        state.error = null;
      })
      .addCase(generateSlides.fulfilled, (state, action) => {
        state.slides = action.payload;
        state.isGeneratingSlides = false;
        // Ensure activeSlideId is set to the first slide if slides exist
        if (action.payload.length > 0) {
          state.activeSlideId = action.payload[0].id;
        } else {
          state.activeSlideId = null;
        }
      })
      .addCase(generateSlides.rejected, (state, action) => {
        state.isGeneratingSlides = false;
        state.error = {
          message: action.error.message || 'Failed to generate slides',
          context: undefined,
        };
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

// Selectors
export const selectOutline = (state: RootState) => state.presentation.outline;
export const selectSlides = (state: RootState) => state.presentation.slides;
export const selectActiveSlideId = (state: RootState) => state.presentation.activeSlideId;
export const selectActiveSlide = (state: RootState) => {
  const activeId = state.presentation.activeSlideId;
  return activeId ? state.presentation.slides.find((s: Slide) => s.id === activeId) : null;
};
export const selectDefaultLayout = (state: RootState) => state.presentation.defaultLayout;
export const selectLoading = (state: RootState) => state.presentation.isGeneratingOutline || state.presentation.isGeneratingSlides;
export const selectError = (state: RootState) => state.presentation.error;

export default presentationSlice.reducer;
