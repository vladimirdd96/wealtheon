"use client";

import React, { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import dynamic from 'next/dynamic';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Dynamically import the wallet components with SSR disabled
const WalletProviderComponents = dynamic(
  async () => {
    const { ConnectionProvider, WalletProvider } = await import('@solana/wallet-adapter-react');
    const { WalletModalProvider } = await import('@solana/wallet-adapter-react-ui');
    const { 
      PhantomWalletAdapter,
      SolflareWalletAdapter,
      CloverWalletAdapter,
      Coin98WalletAdapter,
      LedgerWalletAdapter,
      TorusWalletAdapter,
      CoinbaseWalletAdapter,
      TrustWalletAdapter
    } = await import('@solana/wallet-adapter-wallets');

    // Define the component
    return ({ children, endpoint }: { children: React.ReactNode; endpoint: string }) => {
      // Initialize all the wallets you want to support
      const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new CoinbaseWalletAdapter(),
        new CloverWalletAdapter(),
        new Coin98WalletAdapter(),
        new LedgerWalletAdapter(),
        new TorusWalletAdapter(),
        new TrustWalletAdapter()
      ], []);

      return (
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      );
    };
  },
  { ssr: false }
);

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  // Define the network
  const network = WalletAdapterNetwork.Mainnet;

  // Use custom RPC URL from environment variables if available
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl(network);
  }, [network]);

  // Use a client-side only fallback
  return (
    <WalletProviderComponents endpoint={endpoint}>
      {children}
    </WalletProviderComponents>
  );
} 