"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWalletStore } from "@/store/walletStore";

export function CallToAction() {
  const { connected } = useWalletStore();
  const { setVisible } = useWalletModal();
  
  // Hide the entire section if wallet is connected
  if (connected) return null;

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gray-900 z-0" />
      <div className="absolute inset-0 opacity-30 z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-900 rounded-full filter blur-3xl opacity-30" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-900 rounded-full filter blur-3xl opacity-20" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-900 rounded-full filter blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gray-900/60 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-purple-900/50 shadow-xl overflow-hidden">
          {/* Decorative light effects */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600 rounded-full filter blur-3xl opacity-20" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600 rounded-full filter blur-3xl opacity-20" />
          
          <div className="relative text-center mb-8">
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Start Your AI-Powered Investment Journey
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Join Wealtheon today and transform your investment strategy with our elite AI tools and insights
            </motion.p>
          </div>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button 
              onClick={() => setVisible(true)}
              className="w-full sm:w-auto py-4 px-8 text-lg font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
            >
              Connect Wallet
            </button>
            <Link 
              href="/pricing" 
              className="w-full sm:w-auto py-4 px-8 text-lg font-semibold text-gray-200 bg-gray-800 border border-gray-700 rounded-lg transition-all duration-200 transform hover:scale-105 hover:bg-gray-700"
            >
              Learn More
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 