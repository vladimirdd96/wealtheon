import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  NFT,
  NFTCollection,
  NFTTrade,
  MarketData,
  searchNFTs,
  getNFTDetails,
  getNFTPriceHistory,
  getTrendingCollections,
  getNFTMarketData
} from '@/lib/moralis/nftApi';

interface NFTState {
  // Data states
  nfts: Record<string, NFT>;
  collections: NFTCollection[];
  trendingCollections: NFTCollection[];
  nftTrades: Record<string, NFTTrade[]>;
  priceHistory: Record<string, NFTTrade[]>;
  marketData: MarketData | null;
  searchResults: { result: NFT[]; cursor: string | null; total: number } | null;
  selectedNFT: string | null;
  selectedCollection: string | null;
  
  // UI states
  isLoadingNFTs: boolean;
  isLoadingCollections: boolean;
  isLoadingTrending: boolean;
  isLoadingTrades: boolean;
  isLoadingMarketData: boolean;
  error: string | null;
  
  // Search params
  searchQuery: string;
  searchChain: string;
  searchLimit: number;
  searchCursor: string | null;
  
  // Filter states
  priceRange: string;
  chain: string;
  
  // Actions
  searchNFTs: (query: string, chain?: string, limit?: number) => Promise<void>;
  getNFTDetails: (address: string, tokenId: string, chain?: string) => Promise<void>;
  getNFTPriceHistory: (address: string, tokenId: string, chain?: string) => Promise<void>;
  getTrendingCollections: (chain?: string, limit?: number, days?: number) => Promise<void>;
  getNFTMarketData: (chain?: string, days?: number) => Promise<void>;
  selectNFT: (key: string | null) => void;
  selectCollection: (address: string | null) => void;
  setSearchParams: (params: { query?: string; chain?: string; limit?: number }) => void;
  setFilterParams: (params: { priceRange?: string; chain?: string }) => void;
  clearError: () => void;
  clearSearch: () => void;
}

const getNFTKey = (address: string, tokenId: string, chain: string = 'eth') => {
  return `${chain}:${address}:${tokenId}`;
};

export const useNFTStore = create<NFTState>()(
  persist(
    (set, get) => ({
      // Initial state
      nfts: {},
      collections: [],
      trendingCollections: [],
      nftTrades: {},
      priceHistory: {},
      marketData: null,
      searchResults: null,
      selectedNFT: null,
      selectedCollection: null,
      
      isLoadingNFTs: false,
      isLoadingCollections: false,
      isLoadingTrending: false,
      isLoadingTrades: false,
      isLoadingMarketData: false,
      error: null,
      
      searchQuery: '',
      searchChain: 'eth',
      searchLimit: 10,
      searchCursor: null,
      
      priceRange: 'all',
      chain: 'eth',
      
      // Search NFTs
      searchNFTs: async (query, chain = 'eth', limit = 10) => {
        set({ isLoadingNFTs: true, error: null, searchQuery: query, searchChain: chain, searchLimit: limit });
        
        try {
          const results = await searchNFTs({
            query,
            chain,
            limit,
            cursor: get().searchCursor || ''
          });
          
          set({ 
            searchResults: results,
            searchCursor: results.cursor,
            isLoadingNFTs: false
          });
          
          // Store each NFT in our cache
          const newNFTs = { ...get().nfts };
          results.result.forEach(nft => {
            const key = getNFTKey(nft.tokenAddress, nft.tokenId, chain);
            newNFTs[key] = nft;
          });
          
          set({ nfts: newNFTs });
        } catch (error) {
          console.error('Error searching NFTs:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to search NFTs', 
            isLoadingNFTs: false 
          });
        }
      },
      
      // Get NFT details
      getNFTDetails: async (address, tokenId, chain = 'eth') => {
        const key = getNFTKey(address, tokenId, chain);
        set({ isLoadingNFTs: true, error: null });
        
        try {
          const nft = await getNFTDetails({
            address,
            tokenId,
            chain
          });
          
          set(state => ({
            nfts: {
              ...state.nfts,
              [key]: nft
            },
            selectedNFT: key,
            isLoadingNFTs: false
          }));
        } catch (error) {
          console.error('Error getting NFT details:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get NFT details', 
            isLoadingNFTs: false 
          });
        }
      },
      
      // Get NFT price history
      getNFTPriceHistory: async (address, tokenId, chain = 'eth') => {
        const key = getNFTKey(address, tokenId, chain);
        set({ isLoadingTrades: true, error: null });
        
        try {
          const history = await getNFTPriceHistory({
            address,
            tokenId,
            chain,
            limit: 100 // Get a good amount of history
          });
          
          set(state => ({
            priceHistory: {
              ...state.priceHistory,
              [key]: history.result
            },
            isLoadingTrades: false
          }));
        } catch (error) {
          console.error('Error getting NFT price history:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get NFT price history', 
            isLoadingTrades: false 
          });
        }
      },
      
      // Get trending collections
      getTrendingCollections: async (chain = 'eth', limit = 20, days = 7) => {
        set({ isLoadingTrending: true, error: null });
        
        try {
          const collections = await getTrendingCollections({
            chain,
            limit,
            days
          });
          
          // Check if collections is valid and has length
          if (!collections || !Array.isArray(collections)) {
            console.error('Error getting trending collections: Invalid response format');
            set({ 
              trendingCollections: [],
              isLoadingTrending: false,
              error: 'Failed to get trending collections: Invalid response format'
            });
            return;
          }
          
          if (collections.length === 0) {
            console.error('Error getting trending collections: No collections returned');
            set({ 
              trendingCollections: [],
              isLoadingTrending: false,
              error: 'No trending collections available at this time'
            });
            return;
          }
          
          set({ 
            trendingCollections: collections,
            // Select the first collection if none is selected
            selectedCollection: get().selectedCollection || (collections.length > 0 ? collections[0].address : null),
            isLoadingTrending: false
          });
        } catch (error) {
          console.error('Error getting trending collections:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get trending collections', 
            trendingCollections: [], // Set empty array instead of undefined to avoid length errors
            isLoadingTrending: false 
          });
        }
      },
      
      // Get NFT market data
      getNFTMarketData: async (chain = 'eth', days = 7) => {
        set({ isLoadingMarketData: true, error: null });
        
        try {
          const marketData = await getNFTMarketData({
            chain,
            days
          });
          
          set({ 
            marketData,
            isLoadingMarketData: false
          });
        } catch (error) {
          console.error('Error getting NFT market data:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get NFT market data', 
            isLoadingMarketData: false 
          });
        }
      },
      
      // Select NFT
      selectNFT: (key) => {
        set({ selectedNFT: key });
      },
      
      // Select collection
      selectCollection: (address) => {
        set({ selectedCollection: address });
      },
      
      // Set search params
      setSearchParams: (params) => {
        set({ 
          ...(params.query !== undefined && { searchQuery: params.query }),
          ...(params.chain !== undefined && { searchChain: params.chain }),
          ...(params.limit !== undefined && { searchLimit: params.limit })
        });
      },
      
      // Set filter params
      setFilterParams: (params) => {
        set({ 
          ...(params.priceRange !== undefined && { priceRange: params.priceRange }),
          ...(params.chain !== undefined && { chain: params.chain })
        });
      },
      
      // Clear error
      clearError: () => {
        set({ error: null });
      },
      
      // Clear search
      clearSearch: () => {
        set({ 
          searchResults: null,
          searchQuery: '',
          searchCursor: null
        });
      }
    }),
    {
      name: 'nft-store',
      // Only persist non-loading states and actual data
      partialize: (state) => ({
        nfts: state.nfts,
        collections: state.collections,
        trendingCollections: state.trendingCollections,
        priceHistory: state.priceHistory,
        marketData: state.marketData,
        selectedNFT: state.selectedNFT,
        selectedCollection: state.selectedCollection,
        searchChain: state.searchChain,
        searchLimit: state.searchLimit,
        priceRange: state.priceRange,
        chain: state.chain,
      }),
    }
  )
); 