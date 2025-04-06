"use client";

import React from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWalletStore } from '@/store/walletStore';
import { useWallet } from '@solana/wallet-adapter-react';

// This is a static button that will be shown during SSR
// It will be replaced by the dynamic wallet button on the client
export function StaticWalletButton() {
  return (
    <button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 min-w-[120px]">
      Connect Wallet
    </button>
  );
}

interface WalletButtonProps {
  className?: string;
  children?: React.ReactNode;
  buttonStyle?: 'primary' | 'secondary';
}

export function WalletButton({ 
  className = '', 
  children,
  buttonStyle = 'primary'
}: WalletButtonProps) {
  const { connected, publicKey } = useWalletStore();
  const { setVisible } = useWalletModal();
  const { disconnect } = useWallet();

  // Format wallet address for display
  const formattedAddress = publicKey ? 
    `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 
    '';

  // Open wallet modal or disconnect
  const handleClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  // Default styles
  const primaryButtonClass = "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white";
  const secondaryButtonClass = "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700";
  
  const buttonClass = buttonStyle === 'primary' ? primaryButtonClass : secondaryButtonClass;
  
  return (
    <button
      className={`${buttonClass} font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 ${className}`}
      onClick={handleClick}
    >
      {children || (connected ? formattedAddress : 'Connect Wallet')}
    </button>
  );
} 