// Example types config file after resolving merge conflicts
// Remove BackendSlideLayout import - use SlideLayout from components/types instead
import { SlideLayout } from '../components/types';

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Presentation = {
  id: string;
  title: string;
  slides: string[];
};

export interface APIEndpoints {
  GENERATE_OUTLINE: '/api/generate/outline';
  GENERATE_SLIDES: '/api/generate/slides';
  GENERATE_IMAGE: '/api/generate/image';
  EXPORT: '/api/export';
  LAYOUTS: '/api/layouts';
  LAYOUT_VALIDATE: '/api/layout/validate';
  LAYOUT_SWITCH: '/api/layout/switch';
  UPLOAD_IMAGE: '/api/upload/image';
  HEALTH: '/api/health';
}

export interface APIConfig {
  BASE_URL: string;
  ENDPOINTS: APIEndpoints;
}
