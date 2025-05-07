// DEPRECATED: All Slide and SlideLayout types should be imported from ../../types
// This file should only contain types unique to SlideEditor, not Slide or SlideLayout.

// Layout conversion utilities
export function convertLayoutToFrontend(layout: any): any {
  switch (layout) {
    case 'title-body-image':
      return 'title-bullets-image';
    default:
      return layout;
  }
}

export function convertLayoutToBackend(layout: any): any {
  switch (layout) {
    case 'title-bullets-image':
      return 'title-body-image';
    default:
      return layout;
  }
}

// Content conversion utilities
export const convertContentToBackend = (content: any): any => {
  return content;
};

export const convertContentToFrontend = (content: any): any => {
  return content;
};

// Type guards for layout validation
export const isSlideLayout = (layout: string): boolean => {
  const validLayouts: any[] = [
    'title-only',
    'title-image',
    'title-body',
    'title-body-image',
    'title-bullets',
    'title-bullets-image',
    'two-column',
    'two-column-image',
  ];
  return validLayouts.includes(layout);
};

// Layout features and options
export interface LayoutFeatures {
  supportsImage: boolean;
  supportsBody: boolean;
  supportsBullets: boolean;
  supportsSubtitle: boolean;
  supportsColumns: boolean;
}

export const getLayoutFeatures = (layout: any): LayoutFeatures => {
  return {
    supportsImage: layout.includes('image'),
    supportsBody: layout.includes('body'),
    supportsBullets: layout.includes('bullets'),
    supportsSubtitle: layout === 'title-only' || layout === 'title-image',
    supportsColumns: layout.includes('column'),
  };
};

export interface LayoutOption {
  layout: any;
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
    features: getLayoutFeatures('title-only'),
  },
  {
    layout: 'title-image',
    title: 'Title with Image',
    description: 'Title slide with an image',
    preview: '🖼️',
    features: getLayoutFeatures('title-image'),
  },
  {
    layout: 'title-body',
    title: 'Title with Body',
    description: 'Title with paragraph text',
    preview: '📄',
    features: getLayoutFeatures('title-body'),
  },
  {
    layout: 'title-body-image',
    title: 'Title with Body and Image',
    description: 'Title with paragraph text and image',
    preview: '📄🖼️',
    features: getLayoutFeatures('title-body-image'),
  },
  {
    layout: 'title-bullets',
    title: 'Title with Bullets',
    description: 'Title with bullet points',
    preview: '📋',
    features: getLayoutFeatures('title-bullets'),
  },
  {
    layout: 'title-bullets-image',
    title: 'Title with Bullets and Image',
    description: 'Title with bullet points and image',
    preview: '📋🖼️',
    features: getLayoutFeatures('title-bullets-image'),
  },
  {
    layout: 'two-column',
    title: 'Two Columns',
    description: 'Title with two text columns',
    preview: '🔲🔲',
    features: getLayoutFeatures('two-column'),
  },
  {
    layout: 'two-column-image',
    title: 'Two Columns with Image',
    description: 'Title with two columns and image',
    preview: '🔲🖼️',
    features: getLayoutFeatures('two-column-image'),
  },
];

// EditorProps kept for SlideEditor-specific use
export interface EditorProps {
  slide: any;
  onChange: (slide: any) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onImageGenerate?: (prompt: string, service?: string) => Promise<any>;
  onSafetyCheck?: (content: string) => Promise<{
    passed: boolean;
    reason?: string;
    topics?: string[];
    level?: 'low' | 'medium' | 'high';
  }>;
}
