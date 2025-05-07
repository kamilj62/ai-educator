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
  GENERATE_OUTLINE: '/generate/outline';
  GENERATE_SLIDE: '/generate/slide';
}

export interface APIConfig {
  BASE_URL: string;
  ENDPOINTS: APIEndpoints;
}
