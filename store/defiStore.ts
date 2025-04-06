import { create } from 'zustand';

interface DefiPosition {
  protocol: string;
  chain: string;
  positionValue: number;
  network: string;
  tokenAddress: string;
  tokenSymbol: string;
  balance: string;
  balanceUsd: number;
  lpDetails?: {
    token0: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      balance: string;
      balanceUsd: number;
    };
    token1: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      balance: string;
      balanceUsd: number;
    };
  };
}

interface DefiProtocolSummary {
  protocol: string;
  chain: string;
  positionValue: number;
  positions: number;
}

interface DefiState {
  // Data
  isLoading: boolean;
  error: string | null;
  walletAddress: string | null;
  protocolSummary: DefiProtocolSummary[];
  positions: DefiPosition[];
  totalValue: number;

  // Actions
  setWalletAddress: (address: string | null) => void;
  fetchDefiSummary: (address: string) => Promise<void>;
  fetchDefiPositions: (address: string) => Promise<void>;
  fetchDefiPositionsByProtocol: (address: string, protocol: string) => Promise<void>;
  reset: () => void;
}

export const useDefiStore = create<DefiState>((set, get) => ({
  // Initial state
  isLoading: false,
  error: null,
  walletAddress: null,
  protocolSummary: [],
  positions: [],
  totalValue: 0,

  // Set wallet address
  setWalletAddress: (address) => set({ walletAddress: address }),

  // Reset state
  reset: () => set({
    isLoading: false,
    error: null,
    protocolSummary: [],
    positions: [],
    totalValue: 0
  }),

  // Fetch DeFi protocol summary for wallet
  fetchDefiSummary: async (address) => {
    if (!address) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`/api/moralis/wallets/${address}/defi/summary`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch DeFi summary');
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        set({ 
          protocolSummary: [],
          totalValue: 0,
          isLoading: false 
        });
        return;
      }
      
      // Calculate total value
      const totalValue = data.reduce((sum: number, protocol: DefiProtocolSummary) => 
        sum + (protocol.positionValue || 0), 0);
      
      set({ 
        protocolSummary: data,
        totalValue,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching DeFi summary:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch DeFi data',
        isLoading: false,
        protocolSummary: [],
        totalValue: 0
      });
    }
  },

  // Fetch DeFi positions for wallet
  fetchDefiPositions: async (address) => {
    if (!address) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`/api/moralis/wallets/${address}/defi/positions`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch DeFi positions');
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        set({ 
          positions: [],
          isLoading: false 
        });
        return;
      }
      
      set({ 
        positions: data,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching DeFi positions:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch DeFi positions',
        isLoading: false,
        positions: []
      });
    }
  },

  // Fetch detailed DeFi positions by protocol
  fetchDefiPositionsByProtocol: async (address, protocol) => {
    if (!address || !protocol) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`/api/moralis/wallets/${address}/defi/${protocol}/positions`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch positions for ${protocol}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        // If no protocol-specific positions, don't update state
        set({ isLoading: false });
        return;
      }
      
      // Merge with existing positions
      const currentPositions = get().positions.filter(p => p.protocol !== protocol);
      
      set({ 
        positions: [...currentPositions, ...data],
        isLoading: false
      });
    } catch (error) {
      console.error(`Error fetching ${protocol} positions:`, error);
      set({ 
        error: error instanceof Error ? error.message : `Failed to fetch ${protocol} positions`,
        isLoading: false
      });
    }
  }
})); 