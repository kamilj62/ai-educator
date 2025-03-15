/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8005/api/:path*',
      },
      {
        source: '/generate/:path*',
        destination: 'http://localhost:8005/generate/:path*',
      }
    ]
  },
}

module.exports = nextConfig
