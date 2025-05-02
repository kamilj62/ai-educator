/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
<<<<<<< HEAD
        destination: 'http://localhost:8000/:path*',
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
