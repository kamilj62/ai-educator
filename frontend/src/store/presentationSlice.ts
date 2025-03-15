import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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
export type InstructionalLevel = 
  | "elementary"
  | "middle_school"
  | "high_school"
  | "university"
  | "professional";

export interface SlideTopic {
  title: string;
  description: string;
}

export interface BulletPoint {
  text: string;
  sub_points?: string[];
  emphasis?: boolean;
}

export interface Example {
  text: string;
  details?: string[];
}

export interface SlideContent {
  title: string;
  subtitle?: string;
  introduction?: string;
  bullet_points: BulletPoint[];
  examples: Example[];
  key_takeaway?: string;
  discussion_questions: string[];
  image_url?: string;
  image_caption?: string;
}

export interface Presentation {
  topics: SlideTopic[];
  slides?: SlideContent[];
  instructional_level: InstructionalLevel;
  num_slides: number;
}

interface PresentationState {
  presentation: Presentation | null;
  loading: boolean;
  error: string | null;
  exportFormat: ExportFormat;
  exportStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  exportError: string | null;
}

const initialState: PresentationState = {
  presentation: null,
  loading: false,
  error: null,
  exportFormat: 'pdf',
  exportStatus: 'idle',
  exportError: null
};

export const generateOutline = createAsyncThunk(
  'presentation/generateOutline',
  async (input: { context: string; num_slides: number; instructional_level: InstructionalLevel }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.generateOutline}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
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
    } catch (error) {
      console.error('Network error:', error);
      return rejectWithValue('Failed to connect to server. Please ensure the backend is running.');
    }
  }
);

export const generateSlides = createAsyncThunk(
  'presentation/generateSlides',
  async (input: { topic: SlideTopic; instructional_level: InstructionalLevel }, { rejectWithValue }) => {
    try {
      console.log('Generating slides with input:', input);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.generateSlides}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(input),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Server response:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('Server error response:', text);
        let errorMessage;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.detail || errorData.error || `Server error: ${response.status}`;
        } catch (e) {
          errorMessage = `Server error: ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`;
        }
        return rejectWithValue(errorMessage);
      }

      const data = await response.json();
      console.log('Received slide data:', data);
      
      // Return the slide content directly since it's already in the correct format
      return data;
    } catch (error) {
      console.error('Network error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return rejectWithValue('Request timed out. Please try with fewer slides or a simpler topic.');
        }
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Network error occurred');
    }
  }
);

export const exportPresentation = createAsyncThunk(
  'presentation/exportPresentation',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { presentation, exportFormat } = state.presentation;

      if (!presentation) {
        return rejectWithValue('No presentation to export');
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.export}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          presentation,
          format: exportFormat,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.detail || `Server error: ${response.status}`;
        } catch (e) {
          errorMessage = `Server error: ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`;
        }
        return rejectWithValue(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Network error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Network error occurred');
    }
  }
);

const presentationSlice = createSlice({
  name: 'presentation',
  initialState,
  reducers: {
    setExportFormat(state, action: PayloadAction<ExportFormat>) {
      state.exportFormat = action.payload;
    },
    resetExportStatus(state) {
      state.exportStatus = 'idle';
      state.exportError = null;
    },
    clearPresentation(state) {
      state.presentation = null;
      state.loading = false;
      state.error = null;
      state.exportStatus = 'idle';
      state.exportError = null;
    },
    updateTopics(state, action: PayloadAction<SlideTopic[]>) {
      console.log('Updating topics:', action.payload);
      if (state.presentation) {
        state.presentation.topics = action.payload;
      }
    },
    updateSlides(state, action: PayloadAction<SlideContent[]>) {
      console.log('Updating slides:', action.payload);
      if (state.presentation) {
        state.presentation.slides = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateOutline.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateOutline.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.presentation = action.payload;
      })
      .addCase(generateOutline.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(generateSlides.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Generate slides pending...');
      })
      .addCase(generateSlides.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        console.log('Generate slides fulfilled:', action.payload);
        if (state.presentation && action.payload) {
          state.presentation.slides = action.payload;
        }
      })
      .addCase(generateSlides.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error('Generate slides rejected:', action.payload);
      })
      .addCase(exportPresentation.pending, (state) => {
        state.exportStatus = 'loading';
        state.exportError = null;
      })
      .addCase(exportPresentation.fulfilled, (state) => {
        state.exportStatus = 'succeeded';
      })
      .addCase(exportPresentation.rejected, (state, action) => {
        state.exportStatus = 'failed';
        state.exportError = action.payload as string;
      });
  },
});

export const { 
  setExportFormat, 
  resetExportStatus, 
  clearPresentation, 
  updateTopics,
  updateSlides 
} = presentationSlice.actions;

export default presentationSlice.reducer;

export const selectPresentation = (state: RootState) => state.presentation.presentation;
export const selectLoading = (state: RootState) => state.presentation.loading;
export const selectError = (state: RootState) => state.presentation.error;
export const selectExportFormat = (state: RootState) => state.presentation.exportFormat;
export const selectExportStatus = (state: RootState) => state.presentation.exportStatus;
export const selectExportError = (state: RootState) => state.presentation.exportError;
