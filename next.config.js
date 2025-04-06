/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: false,
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
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      if (config.optimization && config.optimization.minimizer) {
        config.optimization.minimizer = [];
      }
      
      config.optimization.minimize = false;
    }
    
    return config;
  },
};

module.exports = nextConfig; 