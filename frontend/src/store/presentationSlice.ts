import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Slide, SlideContent, SlideLayout, SlideImage, SlideTopic, BulletPoint, InstructionalLevel } from '../components/SlideEditor/types';
import { RootState } from './store';

// Types
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
  instructionalLevel: 'high_school',
  defaultLayout: 'title-bullets',
};

// Async thunks
export const generateOutline = createAsyncThunk(
  'presentation/generateOutline',
  async (params: {
    topic: string;
    numSlides: number;
    instructionalLevel: InstructionalLevel;
  }) => {
    try {
      const requestBody = {
        context: params.topic,
        num_slides: params.numSlides,
        instructional_level: params.instructionalLevel,
      };

      console.log("🚀 Sending outline request:", requestBody);
      console.log("🌍 API URL:", `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ai-powerpoint-f44a1d57b590.herokuapp.com'}/generate/outline`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ai-powerpoint-f44a1d57b590.herokuapp.com'}/generate/outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error:", errorText);
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ API Response:", data);

      // Convert topics to SlideTopic format with IDs
      const outline = (Array.isArray(data.topics) ? data.topics : [data.topics]).map((topic: any) => ({
        id: uuidv4(),
        title: typeof topic === 'string' ? topic : topic.title,
        key_points: Array.isArray(topic.key_points) ? topic.key_points : [],
        image_prompt: topic.image_prompt || '',
        description: topic.description || ''
      }));

      return outline;
    } catch (error) {
      console.error("❌ Failed to generate outline:", error);
      throw error;
    }
  }
);

export const generateSlides = createAsyncThunk(
  'presentation/generateSlides',
  async (topics: SlideTopic[], { getState }) => {
    try {
      const state = getState() as RootState;
      const slides: Slide[] = [];

      // Generate a slide for each topic
      for (const topic of topics) {
        // Clean up topic object to match API expectations
        const cleanTopic = {
          title: topic.title,
          key_points: topic.key_points,
          image_prompt: topic.image_prompt,
          description: topic.description
        };

        const requestBody = { 
          topic: cleanTopic,
          instructional_level: state.presentation.instructionalLevel,
          layout: state.presentation.defaultLayout
        };      

        console.log("🚀 Sending slide generation request:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ai-powerpoint-f44a1d57b590.herokuapp.com'}/generate/slides`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Server error:", errorText);
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ API Response:", data);

        // Create a slide from the response
        const slide: Slide = {
          id: topic.id || String(Date.now()),
          layout: requestBody.layout,
          content: {
            title: data.title || topic.title,
            subtitle: data.subtitle || '',
            body: data.body || '',
            bullets: data.bullet_points || topic.key_points.map(point => ({ text: point })),
            image: data.image_url ? {
              url: data.image_url,
              alt: data.image_alt || topic.image_prompt || '',
              caption: data.image_caption || topic.image_prompt || '',
              service: 'generated',
              prompt: topic.image_prompt || ''
            } : undefined,
            image_prompt: topic.image_prompt || '',
            instructionalLevel: state.presentation.instructionalLevel
          }
        };

        console.log("Generated Slide:", slide);
        slides.push(slide);
      }

      return slides;
    } catch (error) {
      console.error("❌ Failed to generate slides:", error);
      throw error;
    }
  }
);

export const updateTopicPoint = createAsyncThunk(
  'presentation/updateTopicPoint',
  async (params: { topicId: string; pointIndex: number; newText: string }) => {
    return params;
  }
);

export const deleteTopicPoint = createAsyncThunk(
  'presentation/deleteTopicPoint',
  async (params: { topicId: string; pointIndex: number }) => {
    return params;
  }
);

export const addTopicPoint = createAsyncThunk(
  'presentation/addTopicPoint',
  async (params: { topicId: string; text: string }) => {
    return params;
  }
);

// Slice
const presentationSlice = createSlice({
  name: 'presentation',
  initialState,
  reducers: {
    setSlides: (state, action: PayloadAction<Slide[]>) => {
      state.slides = action.payload;
    },
    updateOutline: (state, action: PayloadAction<SlideTopic[]>) => {
      console.log('Updating outline with:', action.payload);
      state.outline = action.payload;
    },
    setActiveSlide: (state, action: PayloadAction<string>) => {
      console.log('Setting active slide to:', action.payload);
      state.activeSlideId = action.payload;
    },
    setError: (state, action: PayloadAction<APIError | null>) => {
      state.error = action.payload;
    },
    setInstructionalLevel: (state, action: PayloadAction<InstructionalLevel>) => {
      state.instructionalLevel = action.payload;
    },
    setDefaultLayout: (state, action: PayloadAction<SlideLayout>) => {
      state.defaultLayout = action.payload;
    },

    // ✅ Fixed: Move `reorderSlides` inside reducers
    reorderSlides: (
      state,
      action: PayloadAction<{ startIndex: number; endIndex: number }>
    ) => {
      const { startIndex, endIndex } = action.payload;
      const [movedSlide] = state.slides.splice(startIndex, 1);
      state.slides.splice(endIndex, 0, movedSlide);
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
        state.slides = [...state.slides, ...action.payload];
        state.isGeneratingSlides = false;
      })
      .addCase(generateSlides.rejected, (state, action) => {
        state.isGeneratingSlides = false;
        state.error = {
          message: action.error.message || 'Failed to generate slides',
          context: action.meta.arg[0] ? { topic: action.meta.arg[0].title } : undefined,
        };
      })
      .addCase(updateTopicPoint.fulfilled, (state, action) => {
        const { topicId, pointIndex, newText } = action.payload;
        const topic = state.outline.find((t) => t.id === topicId);
        if (topic) {
          topic.key_points[pointIndex] = newText;
        }
      })
      .addCase(deleteTopicPoint.fulfilled, (state, action) => {
        const { topicId, pointIndex } = action.payload;
        const topic = state.outline.find((t) => t.id === topicId);
        if (topic) {
          topic.key_points.splice(pointIndex, 1);
        }
      })
      .addCase(addTopicPoint.fulfilled, (state, action) => {
        const { topicId, text } = action.payload;
        const topic = state.outline.find((t) => t.id === topicId);
        if (topic) {
          topic.key_points.push(text);
        }
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
  return activeId ? state.presentation.slides.find(s => s.id === activeId) : null;
};
export const selectDefaultLayout = (state: RootState) => state.presentation.defaultLayout;

export default presentationSlice.reducer;
