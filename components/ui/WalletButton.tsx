"use client";

import React from 'react';

// This is a static button that will be shown during SSR
// It will be replaced by the dynamic wallet button on the client
export function StaticWalletButton() {
  return (
    <button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 min-w-[120px]">
      Connect Wallet
    </button>
  );
} 