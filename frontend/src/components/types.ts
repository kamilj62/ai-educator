// Slide layout types
export type SlideLayout =
  | 'title'
  | 'title-image'
  | 'title-bullets'
  | 'image-bullets'
  | 'bullets'
  | 'section-title';

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

// Slide type
export interface Slide {
  id: string;
  title: string;
  content: string;
  layout: SlideLayout;
  imageUrl?: string;
  bulletPoints?: string[];
}

// Presentation type
export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  createdAt?: string;
  updatedAt?: string;
}

// Re-export types from SlideEditor
export * from './SlideEditor/types';
