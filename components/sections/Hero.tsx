"use client";
import React from "react";
import { WavyBackground } from "@/components/ui/wavy-background";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <WavyBackground 
        className="max-w-6xl mx-auto py-32 px-4"
        colors={["#4B0082", "#4c1d95", "#5b21b6", "#7c3aed", "#8b5cf6"]} // Dark purple to indigo gradient
        waveOpacity={0.4} // Reduced opacity to make text more visible
        backgroundFill="#030712" // Very dark gray, almost black
        blur={5}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-black/50 backdrop-blur-sm px-8 py-6 rounded-xl mb-6 border border-purple-500/20"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-200 to-white text-white">
                Where Elite AI Meets 
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-300 text-white">
                Elite Investing
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-black/40 backdrop-blur-sm px-6 py-4 rounded-xl mt-6 mb-12 border border-purple-500/10"
          >
            <p 
              className="text-xl md:text-2xl text-gray-200 max-w-3xl font-medium"
            >
              Personalized investment insights powered by AI, tailored for crypto, NFTs, and DeFi markets. 
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6"
          >
            <button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/40">
              Get Started
            </button>
          </motion.div>
        </div>
      </WavyBackground>
    </section>
  );
} 