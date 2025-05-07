// Example API config file after resolving merge conflicts
import { SlideLayout } from '../components/types';
import type { APIConfig } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

// Define the default layout for outline generation
export const DEFAULT_LAYOUT: SlideLayout = 'title-bullets';

export const API_CONFIG: APIConfig = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    GENERATE_OUTLINE: '/generate/outline',
    GENERATE_SLIDE: '/generate/slide',
  },
} as const;

export default API_BASE_URL;
