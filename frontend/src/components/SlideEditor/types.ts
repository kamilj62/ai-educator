<<<<<<< HEAD
// Image generation service types
export type ImageService = 'dalle' | 'imagen' | 'generated' | 'upload';

// Base types for layouts
export type BackendSlideLayout = 
  | 'title-only'
=======
export type SlideLayout = 
  | 'title'
>>>>>>> dd7ecbd (added imagen images)
  | 'title-image'
  | 'title-body'
  | 'title-body-image'
  | 'title-bullets'
  | 'title-bullets-image'
  | 'two-column'
  | 'two-column-image';

<<<<<<< HEAD
export type SlideLayout = BackendSlideLayout;

// Content types that match the frontend components
export type BulletPoint = {
  text: string;
  subpoints?: BulletPoint[];
};

export type SlideImage = {
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
  // Added for draggable/resizable support
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type InstructionalLevel = 
  | 'elementary_school' 
  | 'middle_school' 
  | 'high_school' 
  | 'university' 
  | 'professional';

export type SlideContent = {
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string;
  image?: SlideImage;
  image_prompt?: string;
  columnLeft?: string;
  columnRight?: string;
  instructionalLevel?: InstructionalLevel;
  // Add fields for examples and discussion_questions for compatibility with generated slides
  examples?: Array<string | { text: string }>;
  discussion_questions?: string[];
  description?: string;
};

export type Slide = {
  id: string;
  layout: SlideLayout;
  content: SlideContent;
  backgroundColor?: string;
  fontColor?: string;
};

// Layout conversion utilities
export function convertLayoutToFrontend(layout: SlideLayout): SlideLayout {
  switch (layout) {
    case 'title-body-image':
      return 'title-bullets-image';
    default:
      return layout;
  }
}

export function convertLayoutToBackend(layout: SlideLayout): SlideLayout {
  switch (layout) {
    case 'title-bullets-image':
      return 'title-body-image';
    default:
      return layout;
  }
}

// Content conversion utilities
export const convertContentToBackend = (content: SlideContent): SlideContent => {
  return content;
};

export const convertContentToFrontend = (content: SlideContent): SlideContent => {
  return content;
};

// Type guards for layout validation
export const isSlideLayout = (layout: string): layout is SlideLayout => {
  const validLayouts: SlideLayout[] = [
    'title-only',
    'title-image',
    'title-body',
    'title-body-image',
    'title-bullets',
    'title-bullets-image',
    'two-column',
    'two-column-image'
  ];
  return validLayouts.includes(layout as SlideLayout);
};

// Layout features and options
export interface LayoutFeatures {
  supportsImage: boolean;
  supportsBody: boolean;
  supportsBullets: boolean;
  supportsSubtitle: boolean;
  supportsColumns: boolean;
}

export const getLayoutFeatures = (layout: SlideLayout): LayoutFeatures => {
  return {
    supportsImage: layout.includes('image'),
    supportsBody: layout.includes('body'),
    supportsBullets: layout.includes('bullets'),
    supportsSubtitle: layout === 'title-only' || layout === 'title-image',
    supportsColumns: layout.includes('column')
  };
};

export interface LayoutOption {
  layout: SlideLayout;
  title: string;
  description: string;
  preview: string;
  features: ReturnType<typeof getLayoutFeatures>;
}

export const layoutOptions: LayoutOption[] = [
  {
    layout: 'title-only',
    title: 'Title Only',
    description: 'Simple title slide with optional subtitle',
    preview: '📝',
    features: getLayoutFeatures('title-only')
  },
  {
    layout: 'title-image',
    title: 'Title with Image',
    description: 'Title slide with an image',
    preview: '🖼️',
    features: getLayoutFeatures('title-image')
  },
  {
    layout: 'title-body',
    title: 'Title with Body',
    description: 'Title with paragraph text',
    preview: '📄',
    features: getLayoutFeatures('title-body')
  },
  {
    layout: 'title-body-image',
    title: 'Title with Body and Image',
    description: 'Title with paragraph text and image',
    preview: '📄🖼️',
    features: getLayoutFeatures('title-body-image')
  },
  {
    layout: 'title-bullets',
    title: 'Title with Bullets',
    description: 'Title with bullet points',
    preview: '📋',
    features: getLayoutFeatures('title-bullets')
  },
  {
    layout: 'title-bullets-image',
    title: 'Title with Bullets and Image',
    description: 'Title with bullet points and image',
    preview: '📋🖼️',
    features: getLayoutFeatures('title-bullets-image')
  },
  {
    layout: 'two-column',
    title: 'Two Columns',
    description: 'Title with two text columns',
    preview: '🔲🔲',
    features: getLayoutFeatures('two-column')
  },
  {
    layout: 'two-column-image',
    title: 'Two Columns with Image',
    description: 'Title with two columns and image',
    preview: '🔲🖼️',
    features: getLayoutFeatures('two-column-image')
  }
];

// Image-related types
export type ErrorType = 
  | 'RATE_LIMIT'
  | 'QUOTA_EXCEEDED'
  | 'SAFETY_VIOLATION'
  | 'INVALID_REQUEST'
  | 'API_ERROR'
  | 'NETWORK_ERROR';

export type APIError = {
  type: ErrorType;
  message: string;
  service?: string;
  retryAfter?: number;
};

export type SlideTopic = {
  id: string;
  title: string;
  key_points: string[];
  image_prompt?: string;
  description?: string;
  subtopics?: SlideTopic[];
  instructionalLevel?: InstructionalLevel;
};

=======
export interface Slide {
  id: string;
  layout: SlideLayout;
  content: {
    title?: string;
    subtitle?: string;
    body?: string;
    bullets?: string[];
    columnLeft?: string;
    columnRight?: string;
    image?: {
      url: string;
      alt: string;
    };
  };
}

>>>>>>> dd7ecbd (added imagen images)
export interface EditorProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onImageUpload?: (file: File) => Promise<string>;
<<<<<<< HEAD
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<SlideImage>;
=======
<<<<<<< HEAD
  onImageGenerate?: (prompt: string, service?: ImageService) => Promise<string>;
>>>>>>> 70d1487b (Update Procfile for Heroku deployment)
  onSafetyCheck?: (content: string) => Promise<{
    passed: boolean;
    reason?: string;
    topics?: string[];
    level?: 'low' | 'medium' | 'high';
  }>;
=======
>>>>>>> dd7ecbd (added imagen images)
}
