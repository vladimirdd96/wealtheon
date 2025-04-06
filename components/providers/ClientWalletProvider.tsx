"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import '@solana/wallet-adapter-react-ui/styles.css';
import { SolanaWalletProvider } from '@/lib/wallet/SolanaWalletProvider';

// Create a client-side only wrapper component for the SolanaWalletProvider
const ClientSideWalletProvider = dynamic(
  () => Promise.resolve(({ children }: { children: React.ReactNode }) => (
    <SolanaWalletProvider>{children}</SolanaWalletProvider>
  )),
  { ssr: false }
);

// Add display name
ClientSideWalletProvider.displayName = 'ClientSideWalletProvider';

export function ClientWalletProvider({ children }: { children: React.ReactNode }) {
  // Force a re-render on the client side
  useEffect(() => {
    // This empty useEffect ensures the component re-renders on the client
  }, []);

  return <ClientSideWalletProvider>{children}</ClientSideWalletProvider>;
} 