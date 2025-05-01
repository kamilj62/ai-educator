// Slide layout types
export type SlideLayout = 
  | 'TITLE'
  | 'TITLE_IMAGE'
  | 'TITLE_BODY'
  | 'TITLE_BODY_IMAGE'
  | 'TITLE_BULLETS'
  | 'TITLE_BULLETS_IMAGE'
  | 'TWO_COLUMN'
  | 'TWO_COLUMN_IMAGE';

// Error handling types
export type ErrorType = 
  | 'RATE_LIMIT'
  | 'QUOTA_EXCEEDED'
  | 'SAFETY_VIOLATION'
  | 'INVALID_REQUEST'
  | 'API_ERROR'
  | 'NETWORK_ERROR';

export type ImageService = 'Imagen' | 'DALL-E';

export interface APIError {
  type: ErrorType;
  message: string;
  service?: ImageService;
  retryAfter?: number;
  context?: {
    topic?: string;
    level?: string;
  };
  originalError?: any;
}

export interface ImageGenerationError extends APIError {
  service: ImageService;
  retryAttempts?: number;
  maxRetries?: number;
}

// Re-export types from SlideEditor
export * from './SlideEditor/types';
