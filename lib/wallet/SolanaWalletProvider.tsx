"use client";

import React, { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter
} from '@solana/wallet-adapter-wallets';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Create a client-side only wrapper component
import dynamic from 'next/dynamic';

const WalletProviderWrapper = dynamic(
  () => Promise.resolve(({ children, endpoint }: { children: React.ReactNode; endpoint: string }) => {
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
  }),
  { ssr: false }
);

// Add display name to the wrapper component
WalletProviderWrapper.displayName = 'WalletProviderWrapper';

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  // Define the network
  const network = WalletAdapterNetwork.Mainnet;

  // Use custom RPC URL from environment variables if available
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl(network);
  }, [network]);

  // Use a client-side only wrapper
  return (
    <WalletProviderWrapper endpoint={endpoint}>
      {children}
    </WalletProviderWrapper>
  );
}

// Add display name to the component
SolanaWalletProvider.displayName = 'SolanaWalletProvider'; 