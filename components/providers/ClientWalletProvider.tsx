"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import '@solana/wallet-adapter-react-ui/styles.css';

// Dynamically import the SolanaWalletProvider with SSR disabled
const SolanaWalletProviderDynamic = dynamic(
  () => import('@/lib/wallet/SolanaWalletProvider').then(mod => mod.SolanaWalletProvider),
  { ssr: false }
);

export function ClientWalletProvider({ children }: { children: React.ReactNode }) {
  // Force a re-render on the client side
  useEffect(() => {
    // This empty useEffect ensures the component re-renders on the client
  }, []);

  return <SolanaWalletProviderDynamic>{children}</SolanaWalletProviderDynamic>;
} 