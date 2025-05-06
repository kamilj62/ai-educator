// Most recent, conflict-free API config for frontend
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  ENDPOINTS: {
    GENERATE_OUTLINE: '/api/generate/outline',
    GENERATE_SLIDE: '/api/generate/slide',
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

// DEBUG: Log API base URL for troubleshooting
console.log('[config] API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);

// Retry configuration for API calls
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
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
