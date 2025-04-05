/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: false,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'react-dom', 'recharts'],
  },
  logging: {
    level: 'warn',
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

module.exports = nextConfig; 