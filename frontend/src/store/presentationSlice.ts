import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

export type ExportFormat = 'pdf' | 'google_slides' | 'pptx';
export type InstructionalLevel = 'elementary' | 'middle_school' | 'high_school' | 'university' | 'professional';

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
  description: string;
  details?: string[];
}

export interface SlideContent {
  title: string;
  subtitle?: string;
  introduction?: string;
  bullet_points?: BulletPoint[];
  examples?: Example[];
  key_takeaway?: string;
  discussion_questions?: string[];
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

const API_BASE_URL = 'http://127.0.0.1:8000';

export const generateOutline = createAsyncThunk(
  'presentation/generateOutline',
  async (input: { context: string; num_slides: number; instructional_level: InstructionalLevel }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(input),
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
      if (!data.topics) {
        return rejectWithValue('Server returned invalid response format');
      }

      return {
        topics: data.topics,
        instructional_level: input.instructional_level,
        num_slides: input.num_slides
      };
    } catch (error) {
      console.error('Network error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Network error occurred');
    }
  }
);

export const generateSlides = createAsyncThunk(
  'presentation/generateSlides',
  async (input: { topics: SlideTopic[]; instructional_level: InstructionalLevel }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(input),
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
      if (!data.slides) {
        return rejectWithValue('Server returned invalid response format');
      }

      return data;
    } catch (error) {
      console.error('Network error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Network error occurred');
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

      const response = await fetch(`${API_BASE_URL}/api/export`, {
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
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateOutline.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateOutline.fulfilled, (state, action) => {
        state.loading = false;
        state.presentation = {
          topics: action.payload.topics,
          instructional_level: action.payload.instructional_level,
          num_slides: action.payload.num_slides
        };
      })
      .addCase(generateOutline.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(generateSlides.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateSlides.fulfilled, (state, action) => {
        state.loading = false;
        if (state.presentation) {
          state.presentation.slides = action.payload.slides;
        }
      })
      .addCase(generateSlides.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
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
  }
});

export const { setExportFormat, resetExportStatus, clearPresentation } = presentationSlice.actions;

export default presentationSlice.reducer;
