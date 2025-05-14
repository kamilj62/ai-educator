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
  async (params: { topic: string; numSlides: number; instructionalLevel: InstructionalLevel }, { rejectWithValue }) => {
    const requestBody = {
      context: params.topic,
      num_slides: params.numSlides,
      instructional_level: mapInstructionalLevel(params.instructionalLevel),
    };
    
    console.log('Sending request to backend with body:', JSON.stringify(requestBody, null, 2));
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_OUTLINE}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add any additional headers if needed
        },
        body: JSON.stringify(requestBody),
        // Remove credentials for now since we're using CORS with specific origins
        // credentials: 'include' as const
      });

      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 200)}...`);
      }

      if (!response.ok) {
        console.error('Backend error response:', data);
        const errorMessage = data?.detail?.message || 
                            data?.message || 
                            `Failed to generate outline: ${response.status} ${response.statusText}`;
        
        return rejectWithValue({
          message: errorMessage,
          details: data,
          status: response.status
        });
      }

      const topics = Array.isArray(data.topics) ? data.topics : [];
      
      if (topics.length === 0) {
        console.warn('No topics returned from the server');
        return rejectWithValue({
          message: 'No topics were generated. The topic might be too specific or complex.',
          details: data,
          status: 200
        });
      }

      // Ensure each topic has required fields
      const processedTopics = topics.map((topic: any, index: number) => ({
        id: topic.id || `topic-${index + 1}`,
        title: topic.title || `Topic ${index + 1}`,
        key_points: Array.isArray(topic.key_points) ? topic.key_points : 
                   (Array.isArray(topic.bullet_points) ? topic.bullet_points : 
                   ['Key point 1', 'Key point 2']),
        description: topic.description || `A presentation about ${topic.title || 'this topic'}`,
        image_prompt: topic.image_prompt || `An illustration representing ${topic.title || 'this topic'}`,
        subtopics: Array.isArray(topic.subtopics) ? topic.subtopics : [],
        instructionalLevel: topic.instructionalLevel || params.instructionalLevel
      }));

      console.log('Processed topics:', processedTopics);
      
      return {
        topics: processedTopics,
        instructionalLevel: params.instructionalLevel
      };
      
    } catch (error) {
      console.error('Error in generateOutline:', error);
      
      if (error instanceof Error) {
        return rejectWithValue({
          message: error.message,
          details: error.cause || error,
          status: 500
        });
      }
      
      return rejectWithValue({
        message: 'An unknown error occurred while generating the outline',
        details: error,
        status: 500
      });
    }
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
  
  // Ensure key_points exists and is an array with at least one item
  let keyPoints: string[] = [];
  
  if (Array.isArray(topic.key_points) && topic.key_points.length > 0) {
    // Handle both string arrays and object arrays
    keyPoints = topic.key_points
      .filter((kp: any) => kp !== null && kp !== undefined)
      .map((kp: any) => {
        // If it's an object with a text property, use that
        if (kp && typeof kp === 'object' && 'text' in kp) {
          return String(kp.text);
        }
        // If it's already a string, use it as is
        if (typeof kp === 'string') {
          return kp;
        }
        // For any other type, convert to string
        return String(kp);
      });
  } else if (topic.key_points) {
    // If key_points is not an array but exists, convert it to an array with a single item
    keyPoints = [String(topic.key_points)];
  }
  
  // If we still don't have any key points, add a default one
  if (keyPoints.length === 0) {
    keyPoints = [topic.title ? `Key information about ${topic.title}` : 'Key point 1'];
  }
  
  // Ensure required fields have proper defaults
  const cleanedTopic = {
    ...rest,
    id: topic.id || `topic-${Math.random().toString(36).substr(2, 9)}`,
    title: topic.title || 'Untitled Topic',
    key_points: keyPoints,
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
      
      // Prepare topics with all required fields
      const preparedTopics = cleanTopics.map(topic => ({
        id: topic.id || `topic-${Math.random().toString(36).substr(2, 9)}`,
        title: topic.title || 'Untitled Topic',
        key_points: topic.key_points || [`Key information about ${topic.title || 'this topic'}`],
        description: topic.description || `A presentation about ${topic.title || 'this topic'}`,
        image_prompt: topic.image_prompt || `An illustration representing ${topic.title || 'this topic'}`,
        subtopics: topic.subtopics || []
      }));
      
      const requestBody = {
        topics: preparedTopics,
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
          'Accept': 'application/json',
          // Add any additional headers if needed
        },
        body: JSON.stringify(requestBody),
        // Remove credentials for CORS compatibility
        // credentials: 'include' as const
      };
      
      console.log('Sending request to:', url);
      console.log('Request options:', {
        ...options,
        body: requestBody // Log the parsed body for better readability
      });
      
      console.log('Sending request to backend...');
      const response = await fetch(url, options);
      
      // Log response status and headers
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      let responseText;
      try {
        responseText = await response.text();
        console.log('Raw response text:', responseText);
      } catch (e) {
        console.error('Failed to read response text:', e);
        throw new Error('Failed to read response from server');
      }
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 200)}...`);
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
      
      // Ensure the response has the expected structure
      if (!responseData.slides) {
        console.warn('Response missing slides array, using empty array');
        responseData.slides = [];
      }
      
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
      console.log('setSlides called with:', action.payload);
      state.slides = action.payload;
      state.activeSlideId = action.payload[0]?.id || null;
    },
    setActiveSlide(state, action: PayloadAction<string | null>) {
      console.log('setActiveSlide called with:', action.payload);
      state.activeSlideId = action.payload;
    },
    updateOutline(state, action: PayloadAction<SlideTopic[]>) {
      console.log('updateOutline called with:', action.payload);
      state.outline = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      console.log('setError called with:', action.payload);
      state.error = action.payload;
    },
    setInstructionalLevel(state, action: PayloadAction<InstructionalLevel>) {
      console.log('setInstructionalLevel called with:', action.payload);
      state.instructionalLevel = action.payload;
    },
    setDefaultLayout(state, action: PayloadAction<SlideLayout>) {
      console.log('setDefaultLayout called with:', action.payload);
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
        // Ensure we have a valid topics array
        if (action.payload && Array.isArray(action.payload.topics)) {
          // Transform topics to ensure they have all required fields
          state.outline = action.payload.topics.map((topic: any) => ({
            id: topic.id || `topic-${Math.random().toString(36).substr(2, 9)}`,
            title: topic.title || 'Untitled Topic',
            key_points: Array.isArray(topic.key_points) 
              ? topic.key_points 
              : [topic.description || 'Key point 1'],
            description: topic.description || `A presentation about ${topic.title || 'this topic'}`,
            image_prompt: topic.image_prompt || `An illustration representing ${topic.title || 'this topic'}`,
            subtopics: Array.isArray(topic.subtopics) 
              ? topic.subtopics.map((subtopic: any) => ({
                  id: subtopic.id || `subtopic-${Math.random().toString(36).substr(2, 9)}`,
                  title: subtopic.title || 'Untitled Subtopic',
                  key_points: Array.isArray(subtopic.key_points) 
                    ? subtopic.key_points 
                    : [subtopic.description || 'Key point 1'],
                  description: subtopic.description || `Details about ${subtopic.title || 'this subtopic'}`,
                  image_prompt: subtopic.image_prompt || `An illustration for ${subtopic.title || 'this subtopic'}`
                }))
              : []
          }));
          console.log('Updated outline with', state.outline.length, 'topics');
        } else {
          console.warn('Received invalid topics in generateOutline.fulfilled:', action.payload);
          state.outline = [];
        }
        state.instructionalLevel = action.payload.instructionalLevel as InstructionalLevel;
      })
      .addCase(generateOutline.rejected, (state, action) => {
        state.isGeneratingOutline = false;
        
        // Handle the rejected value from rejectWithValue
        const errorPayload = action.payload as { 
          message?: string; 
          details?: any; 
          status?: number 
        } | undefined;
        
        // Extract error message from different possible locations
        const errorMessage = errorPayload?.message || 
                           action.error.message || 
                           'Failed to generate outline';
        
        // Log detailed error information for debugging
        console.error('Outline generation failed:', {
          error: action.error,
          payload: errorPayload,
          message: errorMessage
        });
        
        // Set the error state with a user-friendly message
        state.error = errorMessage;
        
        // If we have details in the payload, log them as well
        if (errorPayload?.details) {
          console.error('Error details:', errorPayload.details);
        }
      })
      .addCase(generateSlides.pending, (state) => {
        state.isGeneratingSlides = true;
        state.error = null;
      })
      .addCase(generateSlides.fulfilled, (state, action) => {
        state.isGeneratingSlides = false;
        // The backend returns { success: true, slides: [...] }
        if (action.payload && action.payload.success && Array.isArray(action.payload.slides)) {
          state.slides = action.payload.slides;
        } else if (Array.isArray(action.payload)) {
          // Fallback to the old format if the new format is not present
          state.slides = action.payload;
        } else {
          console.error('Invalid slides data received:', action.payload);
          state.error = 'Received invalid slides data from server';
        }
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
  setActiveSlide,
} = presentationSlice.actions;

// Selectors
export const selectOutline = (state: RootState) => state.presentation.outline;
export const selectSlides = (state: RootState) => state.presentation.slides;
export const selectError = (state: RootState) => state.presentation.error;
export const selectLoading = (state: RootState) => 
  state.presentation.isGeneratingOutline || state.presentation.isGeneratingSlides;

export default presentationSlice.reducer;
