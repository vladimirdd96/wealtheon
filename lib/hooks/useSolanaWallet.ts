"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect, useCallback } from 'react';
import {
  getSolanaBalance,
  getSolanaNFTs,
  getSolanaTokens,
  getSolanaPortfolioValue,
  getSolanaTransactions
} from '../moralis/solanaApi';

interface WalletData {
  balance: number | null;
  nfts: any[] | null;
  tokens: any[] | null;
  portfolio: any | null;
  transactions: any[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useSolanaWallet() {
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const [mounted, setMounted] = useState(false);
  const [walletData, setWalletData] = useState<WalletData>({
    balance: null,
    nfts: null,
    tokens: null,
    portfolio: null,
    transactions: null,
    isLoading: false,
    error: null
  });

  // Set mounted state to true after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchWalletData = useCallback(async () => {
    if (!mounted || !publicKey || !connected) {
      setWalletData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const address = publicKey.toString();
    setWalletData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch wallet balance
      const balanceData = await getSolanaBalance(address);
      
      // Update state with just the balance first for a better UX
      setWalletData(prev => ({
        ...prev,
        balance: balanceData ? parseFloat(balanceData.solana) : null
      }));

      // Parallel fetch other data
      const [nftsData, tokensData, portfolioData, transactionsData] = await Promise.all([
        getSolanaNFTs(address),
        getSolanaTokens(address),
        getSolanaPortfolioValue(address),
        getSolanaTransactions(address)
      ]);

      // Update state with all data
      setWalletData({
        balance: balanceData ? parseFloat(balanceData.solana) : null,
        nfts: nftsData?.result || [],
        tokens: tokensData?.tokens || [],
        portfolio: portfolioData,
        transactions: transactionsData?.result || [],
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setWalletData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch wallet data')
      }));
    }
  }, [publicKey, connected, mounted]);

  // Fetch data when wallet is connected
  useEffect(() => {
    if (mounted && connected && publicKey) {
      fetchWalletData();
    }
  }, [connected, publicKey, fetchWalletData, mounted]);

  // Return wallet data and a function to refresh it
  return {
    ...walletData,
    publicKey: mounted ? publicKey : null,
    connected: mounted && connected,
    refreshWalletData: fetchWalletData,
    wallet: mounted ? wallet : null
  };
} 