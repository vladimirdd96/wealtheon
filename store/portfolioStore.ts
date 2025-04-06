import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Type definitions for portfolio data
export interface PortfolioToken {
  name: string;
  symbol: string;
  address: string;
  balance: number;
  price: number;
  value: number;
}

export interface AllocationItem {
  name: string;
  value: number;
  absoluteValue?: number;
  color: string;
}

export interface PerformanceItem {
  name: string;
  performance: number;
}

export interface HistoryItem {
  name: string;
  value: number;
}

export interface PortfolioData {
  totalValue: number;
  currentAllocation: AllocationItem[];
  portfolioHistory: HistoryItem[];
  assetPerformance: PerformanceItem[];
  tokens: PortfolioToken[];
  riskScore: number;
}

interface PortfolioState {
  data: PortfolioData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  
  // Actions
  fetchPortfolioData: (address: string, force?: boolean) => Promise<PortfolioData | null>;
  clearPortfolioData: () => void;
  clearError: () => void;
}

// Helper function to retry API calls
async function retryFetch<T>(
  fetchFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fetchFn();
  } catch (error) {
    if (retries <= 1) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryFetch(fetchFn, retries - 1, delay * 1.5);
  }
}

// Create the portfolio store with persistence
export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      data: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      
      // Fetch portfolio data from the API
      fetchPortfolioData: async (address: string, force = false) => {
        // Check cache first if not forced
        if (!force) {
          const existingData = get().data;
          const lastUpdated = get().lastUpdated;
          
          // If we have data and it's less than 5 minutes old, return it
          if (existingData && lastUpdated && Date.now() - lastUpdated < 5 * 60 * 1000) {
            console.log('Using cached portfolio data');
            return existingData;
          }
        }
        
        try {
          set(state => ({ 
            isLoading: true,
            error: null 
          }));
          
          // Use the new Moralis portfolio endpoint
          const walletDataEndpoint = `/api/moralis/account/${address}/portfolio?network=mainnet&chain=solana`;
          
          // Use retry logic to handle potential API failures
          const portfolioData = await retryFetch(async () => {
            const response = await fetch(walletDataEndpoint);
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to fetch portfolio data');
            }
            
            return await response.json();
          });
          
          // Store the data with timestamp
          set({
            data: portfolioData,
            isLoading: false,
            lastUpdated: Date.now()
          });
          
          return portfolioData;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load portfolio data';
          console.error('Portfolio data fetch error:', error);
          
          set({
            isLoading: false,
            error: errorMessage
          });
          
          return null;
        }
      },
      
      // Clear portfolio data
      clearPortfolioData: () => set({ 
        data: null,
        lastUpdated: null 
      }),
      
      // Clear error state
      clearError: () => set({ error: null })
    }),
    {
      name: 'portfolio-storage',
      // Only persist these fields
      partialize: (state) => ({
        data: state.data,
        lastUpdated: state.lastUpdated
      })
    }
  )
); 