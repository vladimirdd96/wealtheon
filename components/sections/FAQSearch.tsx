"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface FAQSearchProps {
  onSearch: (searchTerm: string) => void;
}

export function FAQSearch({ onSearch }: FAQSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsTyping(true);
  };

  // Debounce search for better performance
  useEffect(() => {
    if (!isTyping) return;
    
    const debounceTimer = setTimeout(() => {
      onSearch(searchTerm);
      setIsTyping(false);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, isTyping, onSearch]);

  return (
    <motion.div 
      className="w-full max-w-2xl mx-auto mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder="Search for answers..."
          className="w-full py-4 px-6 pl-12 bg-gray-800/50 border border-gray-700 focus:border-violet-500 rounded-xl 
                    text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {searchTerm && (
          <button 
            onClick={() => {
              setSearchTerm("");
              onSearch("");
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
} 