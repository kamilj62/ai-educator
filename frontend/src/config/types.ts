import { BackendSlideLayout } from '../components/SlideEditor/types';

export interface APIEndpoints {
  GENERATE_OUTLINE: '/generate/outline';
  GENERATE_SLIDE: '/generate/slide';
}

export interface APIConfig {
  BASE_URL: string;
  ENDPOINTS: APIEndpoints;
}
