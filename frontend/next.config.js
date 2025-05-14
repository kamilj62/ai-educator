/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove basePath and assetPrefix for now to test
  // basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    domains: ['ai-powerpoint-f44a1d57b590.herokuapp.com'],
    unoptimized: true,
  },
  // Add this to ensure static files are served correctly
  experimental: {
    optimizeFonts: true,
  },
  // Ensure static files are properly cached
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
