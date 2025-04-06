"use client";
import { useEffect } from 'react';
import { useMarketDataStore } from '@/store';

export function ZustandStoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { 
    fetchAllMarketData,
    fetchTokenPrices, 
    isLoading, 
    error,
    clearError
  } = useMarketDataStore();

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

  return children;
} 