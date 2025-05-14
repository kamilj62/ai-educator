// API Configuration - This is the legacy config, prefer using src/config/api.ts
// These values are kept for backward compatibility

// In the browser, we'll use relative URLs (handled by Next.js rewrites)
// In Node.js (SSR), we'll use the full URL if provided
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    generateOutline: '/generate/outline',
    generateSlide: '/generate/slide',
    export: '/export',
    static: '/static',
} as const;

// Log the API configuration for debugging
console.log('[config] API_BASE_URL:', API_BASE_URL);
console.log('[config] Environment:', process.env.NODE_ENV);
