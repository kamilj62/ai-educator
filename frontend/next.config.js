/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ai-powerpoint-f44a1d57b590.herokuapp.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_BASE_URL
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '')}/api/:path*`
          : 'http://localhost:8000/api/:path*',
      },
      {
        source: '/generate/:path*',
        destination: 'http://localhost:8005/generate/:path*',
      }
    ];
  },
};

module.exports = nextConfig;
