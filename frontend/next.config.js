/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure static file handling
  images: {
    domains: ['ai-powerpoint-f44a1d57b590.herokuapp.com'],
    unoptimized: true,
  },
  // Ensure static files are properly served
  async headers() {
    return [
      {
        source: '/(.*).(jpg|jpeg|png|webp|gif|avif|otf|ttf|woff|woff2|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/ai-ppt-logo.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Content-Type',
            value: 'image/svg+xml',
          },
        ],
      },
    ];
  },
  async rewrites() {
    // Always use the Heroku backend URL
    const backendUrl = 'https://ai-powerpoint-f44a1d57b590.herokuapp.com';
    console.log('[next.config.js] Using backend URL:', backendUrl);
      
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  // Add environment variables to be available on the client side
  env: {
    // Always use the Heroku backend URL
    NEXT_PUBLIC_API_BASE_URL: 'https://ai-powerpoint-f44a1d57b590.herokuapp.com'
  },
  // Enable server-side debugging
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    apiUrl: 'https://ai-powerpoint-f44a1d57b590.herokuapp.com/api',
  },
};

module.exports = nextConfig;
