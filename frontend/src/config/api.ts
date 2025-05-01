import type { APIConfig } from './types';
import type { BackendSlideLayout } from '../components/SlideEditor/types';

// Define the default layout for outline generation
export const DEFAULT_LAYOUT: BackendSlideLayout = 'title-bullets';

export const API_CONFIG: APIConfig = {
<<<<<<< HEAD
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  ENDPOINTS: {
    GENERATE_OUTLINE: '/api/generate/outline',
    GENERATE_SLIDE: '/api/generate/slide',
=======
  BASE_URL: '/api',
  ENDPOINTS: {
    GENERATE_OUTLINE: '/generate/outline',
    GENERATE_SLIDE: '/generate/slide',
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
  },
} as const;
