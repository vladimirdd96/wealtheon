"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const tiers = [
  {
    name: "Basic",
    price: "0.1 SOL",
    description: "General market insights and limited portfolio tracking",
    features: [
      "Daily market summaries",
      "Basic portfolio tracking",
      "Access to community forums",
      "Weekly market reports",
    ],
    mostPopular: false,
    borderColor: "border-violet-800/30",
    bgGradient: "from-gray-900 via-gray-900 to-gray-900",
    hoverGlow: "hover:shadow-violet-600/10",
  },
  {
    name: "Advanced",
    price: "0.5 SOL",
    description: "Detailed market predictions and custom portfolio recommendations",
    features: [
      "All Basic features",
      "Custom portfolio recommendations",
      "Detailed market predictions",
      "Token investment opportunities",
      "AI sentiment analysis",
    ],
    mostPopular: true,
    borderColor: "border-violet-600/50",
    bgGradient: "from-gray-900 via-gray-800 to-gray-900",
    hoverGlow: "hover:shadow-violet-500/20",
  },
  {
    name: "Premium",
    price: "1.5 SOL",
    description: "Elite AI-assisted personalized financial coaching and full access",
    features: [
      "All Advanced features",
      "Personalized financial coaching",
      "Full access to all advanced tools",
      "Early insights on emerging trends",
      "NFT rarity and valuation analysis",
      "DeFi yield optimization",
    ],
    mostPopular: false,
    borderColor: "border-indigo-600/50",
    bgGradient: "from-gray-900 via-gray-800 to-gray-900",
    hoverGlow: "hover:shadow-indigo-500/20",
  },
];

export function SubscriptionTiers() {
  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            NFT-Based Membership
          </motion.h2>
          <motion.p
            className="text-xl text-gray-400 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Mint our exclusive NFTs to unlock premium features and personalized insights
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              className={`bg-gradient-to-b ${tier.bgGradient} rounded-2xl overflow-hidden border ${tier.borderColor} shadow-xl ${tier.hoverGlow} transition-all duration-500`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              {tier.mostPopular && (
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center py-2 font-medium">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                </div>
                <p className="text-gray-400 mb-6">{tier.description}</p>

                <div className="space-y-4 mb-8">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center">
                      <svg
                        className="text-purple-500 w-5 h-5 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full py-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 
                    ${
                      tier.mostPopular
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
                        : "bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                >
                  Mint NFT
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View pricing details link */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link 
            href="/pricing#compare-features" 
            className="inline-flex items-center text-violet-400 hover:text-violet-300 transition-colors"
          >
            <span className="font-medium">View detailed pricing comparison</span>
            <svg 
              className="ml-2 w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
} 