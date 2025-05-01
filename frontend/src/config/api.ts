import type { APIConfig } from './types';
import type { BackendSlideLayout } from '../components/SlideEditor/types';

// Define the default layout for outline generation
export const DEFAULT_LAYOUT: BackendSlideLayout = 'title-bullets';

export const API_CONFIG: APIConfig = {
  BASE_URL: '/api',
  ENDPOINTS: {
    GENERATE_OUTLINE: '/api/generate/outline',
    GENERATE_SLIDE: '/api/generate/slide',
  },
} as const;
