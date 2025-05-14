import { SlideLayout } from '../components/types';
import type { APIConfig } from './types';

// Always use the Heroku backend URL
const API_BASE_URL = 'https://ai-powerpoint-f44a1d57b590.herokuapp.com';

// Define the default layout for outline generation
export const DEFAULT_LAYOUT: SlideLayout = 'title-bullets';

console.log('[api.ts] API_BASE_URL:', API_BASE_URL);

export const API_CONFIG: APIConfig = {
  // Use the full URL in both browser and server
  BASE_URL: API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL,
  ENDPOINTS: {
    GENERATE_OUTLINE: '/api/generate/outline',
    GENERATE_SLIDES: '/api/generate/slides',
    GENERATE_IMAGE: '/api/generate/image',
    EXPORT: '/api/export',
    LAYOUTS: '/api/layouts',
    LAYOUT_VALIDATE: '/api/layout/validate',
    LAYOUT_SWITCH: '/api/layout/switch',
    UPLOAD_IMAGE: '/api/upload/image',
    HEALTH: '/api/health',
  },
} as const;

// For backwards compatibility
export default API_CONFIG.BASE_URL;
