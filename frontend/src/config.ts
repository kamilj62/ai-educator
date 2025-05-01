// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',  // Use relative path for API requests or NEXT_PUBLIC_API_BASE_URL if set
  ENDPOINTS: {
    GENERATE_OUTLINE: '/generate/outline',
    GENERATE_SLIDE: '/generate/slide',
    GENERATE_SLIDES: '/generate/slides',
    EXPORT: '/export',
    LAYOUTS: '/layouts',
    LAYOUT_VALIDATE: '/layout/validate',
    LAYOUT_SWITCH: '/layout/switch',
    UPLOAD_IMAGE: '/upload/image',
    HEALTH: '/health'
  }
} as const;

// Retry configuration for API calls
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000
} as const;

// Utility function to check API health
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};
