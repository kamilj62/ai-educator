import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Slide, SlideContent, SlideLayout, SlideImage, SlideTopic, BulletPoint, InstructionalLevel } from '../components/types';
import { RootState } from './store';
import { normalizeBullets } from '../components/SlideEditor/components/utils';
import { API_CONFIG } from '../config/api';

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

// Map frontend instructional levels to backend expected values
const mapInstructionalLevel = (level: InstructionalLevel): string => {
  // Map frontend levels to backend expected values
  const levelMap: Record<InstructionalLevel, string> = {
    'elementary': 'elementary',
    'middle_school': 'middle_school',
    'high_school': 'high_school',
    'university': 'university',
    'professional': 'professional'
  };
  return levelMap[level] || 'elementary'; // Default to elementary if not found
};

export const generateOutline = createAsyncThunk(
  'presentation/generateOutline',
  async (params: { topic: string; numSlides: number; instructionalLevel: InstructionalLevel }) => {
    const requestBody = {
      context: params.topic,
      num_slides: params.numSlides,
      instructional_level: mapInstructionalLevel(params.instructionalLevel),
    };
    
    console.log('Sending request to backend with body:', JSON.stringify(requestBody, null, 2));
    let response;
    try {
      response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_OUTLINE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('Backend error response:', errorData);
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(`Failed to generate outline: ${response.status} ${response.statusText}`, { cause: errorData });
      }
    } catch (error) {
      console.error('Network or server error:', error);
      throw new Error(`Network error: ${error.message}`, { cause: error });
    }
    const data = await response.json();
    const topics = data.topics || [];
    return {
      topics: topics.map((topic: any) => ({
        ...topic,
        subtopics: topic.subtopics || [],
        instructionalLevel: topic.instructionalLevel || params.instructionalLevel,
      })),
      instructionalLevel: params.instructionalLevel
    };
  }
);

interface GenerateSlidesParams {
  topics: SlideTopic[];
  instructionalLevel: InstructionalLevel;
}

// Helper function to clean topic objects recursively
const cleanTopic = (topic: any): any => {
  if (!topic) return null;
  
  const { instructionalLevel, ...rest } = topic;
  
  // Ensure bullet_points exists and is an array
  let bulletPoints: string[] = [];
  
  if (Array.isArray(topic.bullet_points)) {
    // Handle both string arrays and object arrays
    bulletPoints = topic.bullet_points
      .filter((bp: any) => bp !== null && bp !== undefined)
      .map((bp: any) => {
        // If it's an object with a text property, use that
        if (bp && typeof bp === 'object' && 'text' in bp) {
          return String(bp.text);
        }
        // If it's already a string, use it as is
        if (typeof bp === 'string') {
          return bp;
        }
        // For any other type, convert to string
        return String(bp);
      });
  } else if (topic.bullet_points) {
    // If bullet_points is not an array but exists, convert it to an array with a single item
    bulletPoints = [String(topic.bullet_points)];
  }
  
  // Ensure required fields have proper defaults
  const cleanedTopic = {
    ...rest,
    id: topic.id || `topic-${Math.random().toString(36).substr(2, 9)}`,
    title: topic.title || 'Untitled Topic',
    bullet_points: bulletPoints,
    description: topic.description || `A presentation about ${topic.title || 'this topic'}`,
    image_prompt: topic.image_prompt || `An illustration representing ${topic.title || 'this topic'}`,
    subtopics: Array.isArray(topic.subtopics) 
      ? topic.subtopics.map(cleanTopic).filter(Boolean)
      : []
  };
  
  return cleanedTopic;
};

export const generateSlides = createAsyncThunk(
  'presentation/generateSlides',
  async ({ topics, instructionalLevel }: GenerateSlidesParams, { getState }) => {
    const state = getState() as RootState;
    
    try {
      // Clean topics recursively to ensure all required fields are present
      const cleanTopics = topics.map(cleanTopic).filter(Boolean);
      
      if (cleanTopics.length === 0) {
        throw new Error('No valid topics provided for slide generation');
      }
      
      // Map the instructional level to the expected format
      const mappedLevel = mapInstructionalLevel(instructionalLevel);
      
      const requestBody = {
        topics: cleanTopics,
        instructional_level: mappedLevel,
        layout: state.presentation.defaultLayout || 'title-bullets',
      };
      
      console.log('[generateSlides] Sending request to backend with body:', {
        url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_SLIDES}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody, null, 2)
      });
      
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_SLIDES}`;
      const options = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      };
      
      console.log('Sending request to:', url);
      console.log('Request options:', {
        ...options,
        body: JSON.parse(options.body) // Log the parsed body for better readability
      });
      
      console.log('Sending request to backend...');
      const response = await fetch(url, options);
      const responseText = await response.text();
      
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error(`Invalid JSON response from server: ${responseText}`);
      }

      if (!response.ok) {
        let errorMessage = `Failed to generate slides (Status: ${response.status} ${response.statusText})`;
        console.error('Error response from server:', responseData);
        
        // Try to extract a more detailed error message
        if (responseData) {
          if (responseData.detail) {
            if (typeof responseData.detail === 'string') {
              errorMessage = responseData.detail;
            } else if (responseData.detail.message) {
              errorMessage = responseData.detail.message;
            }
            
            // Log validation errors if present
            if (responseData.detail.errors) {
              console.error('Validation errors:', responseData.detail.errors);
            }
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }
        }
        
        const error = new Error(errorMessage);
        (error as any).response = responseData;
        throw error;
      }
      
      // If we get here, the request was successful
      console.log('Successfully generated slides:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error in generateSlides:', error);
      throw error; // Re-throw to be handled by createAsyncThunk
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
        state.isGeneratingOutline = false;
        state.outline = action.payload.topics;
        state.instructionalLevel = action.payload.instructionalLevel as InstructionalLevel;
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
        // The backend returns { success: true, slides: [...] }
        if (action.payload && action.payload.success && Array.isArray(action.payload.slides)) {
          state.slides = action.payload.slides;
        } else {
          // Fallback to the old format if the new format is not present
          state.slides = action.payload;
        }
        state.isGeneratingSlides = false;
      })
      .addCase(generateSlides.rejected, (state, action) => {
        state.isGeneratingSlides = false;
        
        // Extract detailed error information
        let errorMessage = 'Failed to generate slides';
        const error = action.error as any;
        
        if (error.response) {
          // We have a response from the server
          const response = error.response;
          
          if (response.detail) {
            // Handle structured error response
            if (typeof response.detail === 'string') {
              errorMessage = response.detail;
            } else if (response.detail.message) {
              errorMessage = response.detail.message;
            }
            
            // Add validation errors if present
            if (response.detail.errors) {
              const validationErrors = response.detail.errors
                .map((err: any) => `- ${err.loc.join('.')}: ${err.msg}`)
                .join('\n');
              errorMessage += `\n\nValidation Errors:\n${validationErrors}`;
            }
          } else if (response.message) {
            errorMessage = response.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        state.error = errorMessage;
        console.error('Slide generation failed:', action.error);
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
export const selectLoading = (state: RootState) => 
  state.presentation.isGeneratingOutline || state.presentation.isGeneratingSlides;

export default presentationSlice.reducer;
