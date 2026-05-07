/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Serve BizLens static assets directly when embedded
    return [];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};
module.exports = nextConfig;
