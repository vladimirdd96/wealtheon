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
  
  // Solana Wallet NFTs
  solanaWalletNFTs: Record<string, NFT[]>;
  isLoadingSolanaWalletNFTs: boolean;
  solanaWalletAddress: string | null;
  
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
  
  // Solana Wallet Actions
  getSolanaWalletNFTs: (address: string) => Promise<void>;
  setSolanaWalletAddress: (address: string | null) => void;
  clearSolanaWalletNFTs: () => void;
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
      
      // Solana Wallet NFTs initial state
      solanaWalletNFTs: {},
      isLoadingSolanaWalletNFTs: false,
      solanaWalletAddress: null,
      
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
      },
      
      // Get Solana Wallet NFTs
      getSolanaWalletNFTs: async (address) => {
        if (!address) return;
        
        // If we already have the NFTs for this address and they're not too old, return
        const existingNFTs = get().solanaWalletNFTs[address];
        if (existingNFTs) {
          const lastFetchTime = localStorage.getItem(`solana-nfts-${address}-timestamp`);
          if (lastFetchTime && Date.now() - parseInt(lastFetchTime) < 5 * 60 * 1000) { // 5 minutes
            return;
          }
        }
        
        set({ isLoadingSolanaWalletNFTs: true, error: null });
        
        try {
          const response = await fetch(`/api/moralis/solana/nft/wallet?address=${address}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch Solana wallet NFTs: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Transform Solana NFTs to match our NFT interface
          const transformedNFTs = (data.result || []).map((nft: any) => {
            const metadata = nft.metadata ? 
              (typeof nft.metadata === 'string' ? JSON.parse(nft.metadata) : nft.metadata) : 
              null;
            
            return {
              tokenId: nft.mint,
              tokenAddress: nft.associatedTokenAddress,
              name: metadata?.name || nft.name || 'Unnamed NFT',
              symbol: metadata?.symbol || nft.symbol,
              metadata: metadata,
              image: metadata?.image || metadata?.image_url || nft.uri,
              chain: 'solana',
              amount: nft.amount ? parseInt(nft.amount) : 1,
              owner: address,
              contractType: 'SPL',
              tokenUri: nft.uri,
            };
          });
          
          // Store the NFTs and update timestamp
          set(state => ({
            solanaWalletNFTs: {
              ...state.solanaWalletNFTs,
              [address]: transformedNFTs
            },
            solanaWalletAddress: address,
            isLoadingSolanaWalletNFTs: false
          }));
          
          localStorage.setItem(`solana-nfts-${address}-timestamp`, Date.now().toString());
        } catch (error) {
          console.error('Error fetching Solana wallet NFTs:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch Solana wallet NFTs',
            isLoadingSolanaWalletNFTs: false
          });
        }
      },
      
      // Set Solana wallet address
      setSolanaWalletAddress: (address) => {
        set({ solanaWalletAddress: address });
      },
      
      // Clear Solana wallet NFTs
      clearSolanaWalletNFTs: () => {
        set({ 
          solanaWalletNFTs: {},
          solanaWalletAddress: null
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
        solanaWalletNFTs: state.solanaWalletNFTs,
        solanaWalletAddress: state.solanaWalletAddress,
      }),
    }
  )
); 