import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Slide, SlideContent, SlideLayout, SlideImage, SlideTopic, BulletPoint, InstructionalLevel } from '../components/types';
import { RootState } from './store';
import { normalizeBullets } from '../components/SlideEditor/components/utils';
import { API_CONFIG } from '../config';

export interface APIError {
  message: string;
  context?: { topic: string };
}

interface PresentationState {
  outline: SlideTopic[];
  slides: Slide[];
  isGeneratingSlides: boolean;
  isGeneratingOutline: boolean;
  error: string | null;
  instructionalLevel: InstructionalLevel;
  defaultLayout: SlideLayout;
  activeSlideId: string | null;
}

const initialState: PresentationState = {
  outline: [],
  slides: [],
  isGeneratingSlides: false,
  isGeneratingOutline: false,
  error: null,
  instructionalLevel: 'high_school',
  defaultLayout: 'title-bullets',
  activeSlideId: null,
};

export const generateOutline = createAsyncThunk(
  'presentation/generateOutline',
  async (params: { topic: string; numSlides: number; instructionalLevel: InstructionalLevel }) => {
    // Patch: convert 'elementary_school' to 'elementary' for backend compatibility
    const requestBody = {
      context: params.topic,
      num_slides: params.numSlides,
      instructional_level: params.instructionalLevel === 'elementary_school' ? 'elementary' : params.instructionalLevel,
    };
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_OUTLINE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error('Failed to generate outline');
    }
    const data = await response.json();
    return data.topics.map((topic: any) => ({
      ...topic,
      subtopics: topic.subtopics,
      instructionalLevel: topic.instructionalLevel,
    }));
  }
);

export const generateSlides = createAsyncThunk(
  'presentation/generateSlides',
  async (topics: SlideTopic[], { getState }) => {
    const state = getState() as RootState;
    const requestBody = {
      topics: topics,
      instructional_level: state.presentation.instructionalLevel === 'elementary_school' ? 'elementary' : state.presentation.instructionalLevel,
      layout: state.presentation.defaultLayout,
    };
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_SLIDES}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      let errorMessage = 'Failed to generate slides';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e2) {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data;
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
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setInstructionalLevel(state, action: PayloadAction<InstructionalLevel>) {
      state.instructionalLevel = action.payload;
    },
    setDefaultLayout(state, action: PayloadAction<SlideLayout>) {
      state.defaultLayout = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateOutline.pending, (state) => {
        state.isGeneratingOutline = true;
        state.error = null;
      })
      .addCase(generateOutline.fulfilled, (state, action) => {
        state.outline = action.payload;
        state.isGeneratingOutline = false;
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
        state.error = action.error.message || 'Failed to generate slides';
      });
  },
});

export const {
  setSlides,
  updateOutline,
  setError,
  setInstructionalLevel,
  setDefaultLayout,
} = presentationSlice.actions;

// Selectors
export const selectOutline = (state: RootState) => state.presentation.outline;
export const selectSlides = (state: RootState) => state.presentation.slides;
export const selectError = (state: RootState) => state.presentation.error;
export const selectLoading = (state: RootState) => state.presentation.isGeneratingOutline || state.presentation.isGeneratingSlides;

export default presentationSlice.reducer;
