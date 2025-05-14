/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static optimization to ensure files are always served fresh
  output: 'standalone',
  // Configure images
  images: {
    domains: ['ai-powerpoint-f44a1d57b590.herokuapp.com'],
    unoptimized: true,
    disableStaticImages: true,
  },
  // Disable static optimization for pages
  experimental: {
    optimizeFonts: true,
    optimizeCss: false,
  },
  // Disable file-system routing for static files
  useFileSystemPublicRoutes: false,
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
