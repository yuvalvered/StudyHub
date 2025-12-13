/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Experimental features
  experimental: {
    // Enable server actions for future features
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
