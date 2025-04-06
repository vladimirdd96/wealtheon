"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function LoadingPage() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-50">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo animation */}
        <motion.div
          className="w-24 h-24 mb-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360] 
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          <svg 
            className="w-12 h-12 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
        </motion.div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          Loading Market Data
        </h2>
        
        <p className="text-gray-400 mb-6 text-center max-w-sm">
          Fetching real-time cryptocurrency data from secure sources...
        </p>
        
        {/* Loading bar */}
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 2,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Loading messages that change */}
        <div className="h-6 mt-4 text-sm text-gray-400 relative overflow-hidden">
          <motion.div
            animate={{
              y: [0, -30, -60, -90, -120, 0],
            }}
            transition={{
              duration: 8,
              ease: "easeInOut",
              times: [0, 0.2, 0.4, 0.6, 0.8, 1],
              repeat: Infinity,
              repeatDelay: 0
            }}
            className="absolute left-0 right-0 text-center"
          >
            <div className="h-6 mb-6">Processing market sentiment...</div>
            <div className="h-6 mb-6">Analyzing token performance...</div>
            <div className="h-6 mb-6">Calculating price predictions...</div>
            <div className="h-6 mb-6">Gathering trading signals...</div>
            <div className="h-6">Preparing visualization data...</div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 