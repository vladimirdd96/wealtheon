/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['framer-motion', 'react-dom', 'recharts'],
  },
  serverExternalPackages: ['@moralisweb3/next'],
  logging: {
    level: 'warn',
    fetches: {
      fullUrl: true,
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.optimization.minimize = false;
    return config;
  },
};

module.exports = nextConfig; 