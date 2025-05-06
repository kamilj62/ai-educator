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
<<<<<<< HEAD
        destination: process.env.NEXT_PUBLIC_API_BASE_URL
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`
          : 'http://localhost:8000/api/:path*',
=======
=======
>>>>>>> a8dbce3e (Update Procfile for Heroku deployment)
        destination: 'http://localhost:8000/:path*',
>>>>>>> 02948cc4 (Fix layout type errors, update selectors, and resolve build issues)
      },
    ];
=======
        destination: 'http://localhost:8005/api/:path*',
      },
      {
        source: '/generate/:path*',
        destination: 'http://localhost:8005/generate/:path*',
      }
    ]
>>>>>>> dd7ecbd (added imagen images)
  },
};

module.exports = nextConfig;
