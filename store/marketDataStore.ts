import { create } from 'zustand';
import { 
  getBitcoinPriceData, 
  getEthereumPriceData, 
  getSolanaPriceData, 
  getTopTokens,
  getTokenPrices,
  tokenAddresses
} from '@/lib/moralis/cryptoApi';

export interface PriceData {
  date: string;
  timestamp?: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Token {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  price_usd?: number;
  price_24h_percent_change?: number;
  market_cap_usd?: number;
}

export interface TokenPriceData {
  tokenAddress: string;
  pairAddress?: string;
  exchangeName?: string;
  exchangeAddress?: string;
  nativePrice?: {
    value: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  usdPrice: number;
  usdPrice24h?: number;
  usdPrice24hrUsdChange?: number;
  usdPrice24hrPercentChange?: number;
  logo?: string;
  name: string;
  symbol: string;
}

interface MarketDataState {
  bitcoinData: PriceData[];
  ethereumData: PriceData[];
  solanaData: PriceData[];
  tokenPrices: TokenPriceData[];
  topTokens: Token[];
  isLoading: {
    bitcoin: boolean;
    ethereum: boolean;
    solana: boolean;
    tokenPrices: boolean;
    topTokens: boolean;
  };
  error: string | null;
  lastUpdated: number | null;

  // Actions
  fetchBitcoinData: () => Promise<PriceData[]>;
  fetchEthereumData: () => Promise<PriceData[]>;
  fetchSolanaData: () => Promise<PriceData[]>;
  fetchTokenPrices: (tokens?: string[]) => Promise<TokenPriceData[]>;
  fetchTopTokensData: (limit?: number) => Promise<Token[]>;
  fetchAllMarketData: () => Promise<void>;
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

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  bitcoinData: [],
  ethereumData: [],
  solanaData: [],
  tokenPrices: [],
  topTokens: [],
  isLoading: {
    bitcoin: false,
    ethereum: false,
    solana: false,
    tokenPrices: false,
    topTokens: false
  },
  error: null,
  lastUpdated: null,

  clearError: () => set({ error: null }),

  fetchTokenPrices: async (tokens = Object.values(tokenAddresses)) => {
    try {
      set(state => ({ 
        isLoading: { ...state.isLoading, tokenPrices: true },
        error: null 
      }));
      
      console.log('Fetching token prices for:', tokens.length, 'tokens');
      
      // Use retry logic with Moralis token prices API
      const data = await retryFetch(() => getTokenPrices(tokens));
      
      console.log('Successfully fetched token prices for:', data.length, 'tokens');
      
      set(state => ({ 
        tokenPrices: data || [],
        isLoading: { ...state.isLoading, tokenPrices: false },
        lastUpdated: Date.now()
      }));
      
      return data;
    } catch (error) {
      console.error('Token prices fetch error:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error(`Token prices fetch failed with: ${error.name}: ${error.message}`);
        if ('cause' in error) {
          console.error('Underlying cause:', error.cause);
        }
      }
      
      set(state => ({ 
        isLoading: { ...state.isLoading, tokenPrices: false },
        error: error instanceof Error ? error.message : 'Failed to fetch token prices' 
      }));
      
      // Return empty array instead of throwing to prevent Promise.all from failing
      return [];
    }
  },

  fetchBitcoinData: async () => {
    try {
      set(state => ({ 
        isLoading: { ...state.isLoading, bitcoin: true },
        error: null 
      }));
      
      // Use retry logic
      const data = await retryFetch(() => getBitcoinPriceData());
      
      set(state => ({ 
        bitcoinData: data || [],
        isLoading: { ...state.isLoading, bitcoin: false },
        lastUpdated: Date.now()
      }));
      
      return data;
    } catch (error) {
      console.error('Bitcoin data fetch error:', error);
      set(state => ({ 
        isLoading: { ...state.isLoading, bitcoin: false },
        error: error instanceof Error ? error.message : 'Failed to fetch Bitcoin data' 
      }));
      
      // Return empty array instead of throwing to prevent Promise.all from failing
      return [];
    }
  },

  fetchEthereumData: async () => {
    try {
      set(state => ({ 
        isLoading: { ...state.isLoading, ethereum: true },
        error: null 
      }));
      
      // Use retry logic
      const data = await retryFetch(() => getEthereumPriceData());
      
      set(state => ({ 
        ethereumData: data || [],
        isLoading: { ...state.isLoading, ethereum: false },
        lastUpdated: Date.now()
      }));
      
      return data;
    } catch (error) {
      console.error('Ethereum data fetch error:', error);
      set(state => ({ 
        isLoading: { ...state.isLoading, ethereum: false },
        error: error instanceof Error ? error.message : 'Failed to fetch Ethereum data' 
      }));
      
      // Return empty array instead of throwing to prevent Promise.all from failing
      return [];
    }
  },

  fetchSolanaData: async () => {
    try {
      set(state => ({ 
        isLoading: { ...state.isLoading, solana: true },
        error: null 
      }));
      
      // Use retry logic
      const data = await retryFetch(() => getSolanaPriceData());
      
      set(state => ({ 
        solanaData: data || [],
        isLoading: { ...state.isLoading, solana: false },
        lastUpdated: Date.now()
      }));
      
      return data;
    } catch (error) {
      console.error('Solana data fetch error:', error);
      set(state => ({ 
        isLoading: { ...state.isLoading, solana: false },
        error: error instanceof Error ? error.message : 'Failed to fetch Solana data' 
      }));
      
      // Return empty array instead of throwing to prevent Promise.all from failing
      return [];
    }
  },

  fetchTopTokensData: async (limit = 5) => {
    try {
      set(state => ({ 
        isLoading: { ...state.isLoading, topTokens: true },
        error: null 
      }));
      
      // Use retry logic
      const data = await retryFetch(() => getTopTokens(limit));
      
      set(state => ({ 
        topTokens: data || [],
        isLoading: { ...state.isLoading, topTokens: false },
        lastUpdated: Date.now()
      }));
      
      return data;
    } catch (error) {
      console.error('Top tokens data fetch error:', error);
      set(state => ({ 
        isLoading: { ...state.isLoading, topTokens: false },
        error: error instanceof Error ? error.message : 'Failed to fetch top tokens' 
      }));
      
      // Return empty array instead of throwing to prevent Promise.all from failing
      return [];
    }
  },

  fetchAllMarketData: async () => {
    // Only fetch if not already loading
    const { isLoading } = get();
    if (Object.values(isLoading).some(loading => loading)) {
      return;
    }
    
    set({ error: null });
    
    const { 
      fetchTokenPrices, 
      fetchBitcoinData, 
      fetchEthereumData, 
      fetchSolanaData 
    } = get();
    
    try {
      // First fetch token prices, then use those for other data
      await fetchTokenPrices();
      
      // Fetch other data in parallel
      await Promise.all([
        fetchBitcoinData(),
        fetchEthereumData(),
        fetchSolanaData()
      ]);
    } catch (error) {
      console.error('Error fetching market data:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch market data' 
      });
    }
  }
})); 