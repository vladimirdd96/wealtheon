"use client";
import { useEffect } from 'react';
import { useMarketDataStore, useNFTStore } from '@/store';

export function ZustandStoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { 
    fetchAllMarketData,
    fetchTokenPrices, 
    isLoading: isLoadingMarketData, 
    error: marketDataError,
    clearError: clearMarketDataError
  } = useMarketDataStore();

  const {
    getTrendingCollections,
    getNFTMarketData,
    isLoadingTrending,
    isLoadingMarketData: isLoadingNFTMarketData,
    error: nftError,
    clearError: clearNFTError
  } = useNFTStore();

  // Initialize market data
  useEffect(() => {
    // Add a slight delay before initializing to avoid API rate limits
    // and ensure the component is fully mounted
    const initTimer = setTimeout(() => {
      // First fetch token prices
      fetchTokenPrices()
        .then(() => {
          // Then fetch all other market data
          setTimeout(() => fetchAllMarketData(), 500);
        })
        .catch(err => {
          console.error('Initial data fetch error:', err);
        });
    }, 1000);
    
    // You can also set up refresh intervals here if needed
    // const refreshInterval = setInterval(() => {
    //   fetchAllMarketData();
    // }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    // Cleanup
    return () => {
      clearTimeout(initTimer);
      // clearInterval(refreshInterval);
    };
  }, [fetchAllMarketData, fetchTokenPrices]);

  // Initialize NFT data
  useEffect(() => {
    // Add a delay to avoid hitting API rate limits
    const initNFTTimer = setTimeout(() => {
      // Fetch trending collections
      getTrendingCollections()
        .then(() => {
          // Then fetch NFT market data
          setTimeout(() => getNFTMarketData(), 500);
        })
        .catch(err => {
          console.error('Initial NFT data fetch error:', err);
        });
    }, 2000); // Start after market data initialization
    
    // Cleanup
    return () => {
      clearTimeout(initNFTTimer);
    };
  }, [getTrendingCollections, getNFTMarketData]);

  return children;
} 