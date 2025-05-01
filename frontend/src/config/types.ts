import { BackendSlideLayout } from '../components/SlideEditor/types';

export interface APIEndpoints {
<<<<<<< HEAD
  GENERATE_OUTLINE: '/api/generate/outline';
  GENERATE_SLIDE: '/api/generate/slide';
=======
  GENERATE_OUTLINE: '/generate/outline';
  GENERATE_SLIDE: '/generate/slide';
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
}

export interface APIConfig {
  BASE_URL: string;
  ENDPOINTS: APIEndpoints;
}
