"use client";

import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { StaticWalletButton } from './WalletButton';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

// Import wallet adapter CSS directly
import '@solana/wallet-adapter-react-ui/styles.css';

// Create a client-side only button component 
const WalletModalButton = dynamic(
  () => Promise.resolve(({ className }: { className?: string }) => {
    const { setVisible } = useWalletModal();
    const { publicKey, connected, disconnect } = useWallet();
    
    const openModal = () => {
      setVisible(true);
    };

    if (!connected) {
      return (
        <button 
          onClick={openModal}
          className={`bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 ${className || ''}`}
        >
          Connect Wallet
        </button>
      );
    }

    return (
      <button 
        onClick={disconnect}
        className={`bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 ${className || ''}`}
      >
        Disconnect
      </button>
    );
  }),
  { ssr: false, loading: () => <StaticWalletButton /> }
);

// Set display name for the component
WalletModalButton.displayName = 'WalletModalButton';

export const WalletConnectButton: FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted state once component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Shortened wallet address display
  const shortenedAddress = useMemo(() => {
    if (!publicKey) return '';
    const address = publicKey.toString();
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [publicKey]);

  // Fetch wallet balance when connected
  useEffect(() => {
    if (!mounted || !publicKey || !connected) return;
    
    let isMounted = true;

    const fetchBalance = async () => {
      try {
        setLoading(true);
        const balanceData = await connection.getBalance(publicKey);
        if (isMounted) {
          // Convert from lamports to SOL (1 SOL = 1,000,000,000 lamports)
          setBalance(balanceData / 1_000_000_000);
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
        if (isMounted) setBalance(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBalance();

    return () => {
      isMounted = false;
    };
  }, [publicKey, connection, connected, mounted]);

  // If not mounted yet, show the static button to avoid hydration issues
  if (!mounted) {
    return <StaticWalletButton />;
  }

  return (
    <div className="flex flex-col items-end">
      <WalletModalButton />
      
      {connected && balance !== null && (
        <div className="text-xs mt-1 text-gray-300">
          {shortenedAddress} • {loading ? "Loading..." : `${balance.toFixed(4)} SOL`}
        </div>
      )}
    </div>
  );
}; 