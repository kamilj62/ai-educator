// Slide layout types
export type SlideLayout =
  | 'title-only'
  | 'title-image'
  | 'title-body'
  | 'title-body-image'
  | 'title-bullets'
  | 'title-bullets-image'
  | 'two-column'
  | 'two-column-image';

// Instructional level types
export type InstructionalLevel =
  | 'elementary'
  | 'middle_school'
  | 'high_school'
  | 'university'
  | 'professional';

// Slide topic type
export interface SlideTopic {
  id: string;
  title: string;
  bullet_points: string[];
  image_prompt?: string;
  description?: string;
  subtopics?: SlideTopic[];
  instructionalLevel?: InstructionalLevel;
}

// Slide image type
export type ImageService = 'Imagen' | 'DALL-E' | 'dalle' | 'imagen' | 'generated' | 'upload';

export interface SlideImage {
  url: string;
  alt: string;
  caption?: string;
  service: ImageService;
  prompt?: string;
  metadata?: {
    topics?: string[];
    level?: 'low' | 'medium' | 'high';
  };
  error?: APIError;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

// Bullet point type
export type BulletPoint = { text: string };

// Slide content type
export interface SlideContent {
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string;
  image?: SlideImage;
  image_prompt?: string;
  columnLeft?: string;
  columnRight?: string;
  instructionalLevel?: InstructionalLevel;
  examples?: Array<string | { text: string }>;
  discussion_questions?: string[];
  description?: string;
}

// Slide type
export interface Slide {
  id: string;
  layout: string;
  content: SlideContent;
  backgroundColor?: string;
  fontColor?: string;
}

// Error handling types
export type ErrorType =
  | 'RATE_LIMIT'
  | 'QUOTA_EXCEEDED'
  | 'SAFETY_VIOLATION'
  | 'INVALID_REQUEST'
  | 'API_ERROR'
  | 'NETWORK_ERROR';

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

// Presentation type
export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  createdAt?: string;
  updatedAt?: string;
}
