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
<<<<<<< HEAD
        destination: process.env.NEXT_PUBLIC_API_BASE_URL
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '')}/api/:path*`
          : 'http://localhost:8000/api/:path*',
=======
        destination: 'http://localhost:8000/:path*',
>>>>>>> af182bc4 (Fix layout type errors, update selectors, and resolve build issues)
      },
    ];
  },
};

module.exports = nextConfig;
