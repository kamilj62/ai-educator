import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { Slide, SlideTopic, SlideLayout, InstructionalLevel } from '../components/types';
import { RootState } from './store';
import type { SlideContent } from '../components/SlideEditor/types';

export interface PresentationState {
  outline: SlideTopic[];
  slides: Slide[];
  isGeneratingOutline: boolean;
  isGeneratingSlides: boolean;
  error: string | null;
  instructionalLevel: InstructionalLevel;
  numSlides: number;
  activeSlideId: string | null;
  defaultLayout: SlideLayout;
}

const initialState: PresentationState = {
  outline: [],
  slides: [],
  isGeneratingOutline: false,
  isGeneratingSlides: false,
  error: null,
  instructionalLevel: 'elementary_school',
  numSlides: 5,
  activeSlideId: null,
  defaultLayout: 'title-bullets',
};

export const generateOutline = createAsyncThunk(
  'presentation/generateOutline',
  async (params: { topic: string; numSlides: number; instructionalLevel: InstructionalLevel }) => {
    try {
      const requestBody = {
        context: params.topic,
        num_slides: params.numSlides,
        instructional_level: params.instructionalLevel,
      };

      // Use absolute URL for API call
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/generate/outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch (error: any) {
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
          topic: topic, // Wrap the topic in an object field
          instructional_level: instructionalLevel,
          layout: defaultLayout,
        };
        const response = await fetch(`/api/generate/slides`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        // Map backend response to frontend Slide type
        slides.push({
          id: uuidv4(),
          layout: defaultLayout,
          content: {
            title: data.title || '',
            subtitle: data.subtitle || '',
            body: data.body || '',
            bullets: (data.bullet_points && data.bullet_points.length > 0)
              ? data.bullet_points.map((text: string) => ({ text }))
              : (topic.key_points ? topic.key_points.map(text => ({ text })) : []),
            image: data.image_url ? {
              url: data.image_url,
              alt: data.image_alt || '',
              caption: data.image_caption || '',
              service: data.image_service || '',
            } : undefined,
          }
        });
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
    setOutline(state, action: PayloadAction<SlideTopic[]>) {
      state.outline = action.payload;
    },
    setSlides(state, action: PayloadAction<Slide[]>) {
      state.slides = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setInstructionalLevel(state, action: PayloadAction<InstructionalLevel>) {
      state.instructionalLevel = action.payload;
    },
    setNumSlides(state, action: PayloadAction<number>) {
      state.numSlides = action.payload;
    },
    setActiveSlide(state, action: PayloadAction<string | null>) {
      state.activeSlideId = action.payload;
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
  }
});

export const {
  setOutline,
  setSlides,
  setError,
  setInstructionalLevel,
  setNumSlides,
  setActiveSlide,
  setDefaultLayout,
} = presentationSlice.actions;

export const selectPresentation = (state: RootState) => state.presentation;
export const selectLoading = (state: RootState) => state.presentation.isGeneratingOutline || state.presentation.isGeneratingSlides;
export const selectError = (state: RootState) => state.presentation.error;
export const selectOutline = (state: RootState) => state.presentation.outline;
export const selectSlides = (state: RootState) => state.presentation.slides;
export const selectActiveSlideId = (state: RootState) => state.presentation.activeSlideId;
export const selectActiveSlide = (state: RootState) => {
  const activeId = state.presentation.activeSlideId;
  return activeId ? state.presentation.slides.find((s: Slide) => s.id === activeId) : null;
};
export const selectDefaultLayout = (state: RootState) => state.presentation.defaultLayout;

export default presentationSlice.reducer;
