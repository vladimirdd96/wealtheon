/**
 * NFT API utility functions using Moralis
 */

interface NFTSearchParams {
  query: string;
  chain?: string;
  format?: string;
  limit?: number;
  cursor?: string | null;
}

interface NFTDetailsParams {
  address: string;
  tokenId: string;
  chain?: string;
  format?: string;
}

interface GetTrendingCollectionsParams {
  chain?: string;
  limit?: number;
  days?: number; 
}

// NFT API utility functions for interacting with Moralis API

// Types
export interface NFT {
  tokenId: string;
  tokenAddress: string;
  name?: string;
  symbol?: string;
  metadata?: any;
  image?: string;
  chain?: string;
  amount?: number;
  owner?: string;
  blockNumberMinted?: string;
  blockTimestamp?: string;
  contractType?: string;
  lastMetadataSync?: string;
  lastTokenUriSync?: string;
  tokenUri?: string;
}

export interface NFTTrade {
  blockNumber: string;
  blockTimestamp: string;
  transaction?: {
    hash: string;
    from: string;
    to: string;
    value: string;
  };
  price?: string;
  priceTokenAddress?: string;
  marketplace?: string;
}

export interface NFTCollection {
  id: string;
  address: string;
  name: string;
  symbol: string;
  chain: string;
  totalSupply?: number;
  items?: number;
  owners?: number;
  floorPrice?: number;
  volume24h?: number;
  volume7d?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  marketCap?: number;
  ownershipConcentration?: string;
  risk?: string;
  priceHistory?: Array<{
    date: string;
    price: number;
  }>;
  image?: string;
}

export interface MarketData {
  marketSentiment: string;
  averageFloorPriceChange: number;
  totalTradingVolume: number;
  positivePerformingPercent: number;
  marketRisk: string;
  insights: Array<{
    title: string;
    value: string;
    change: string;
    trend: string;
  }>;
}

export interface SearchNFTsParams {
  query: string;
  chain?: string;
  format?: string;
  limit?: number;
  cursor?: string;
}

export interface GetNFTDetailsParams {
  address: string;
  tokenId: string;
  chain?: string;
  format?: string;
}

export interface GetNFTPriceHistoryParams {
  address: string;
  tokenId: string;
  chain?: string;
  limit?: number;
  cursor?: string;
}

export interface GetNFTMarketDataParams {
  chain?: string;
  days?: number;
}

// Utility functions

/**
 * Search for NFTs by name, description or other attributes
 */
export async function searchNFTs({
  query,
  chain = 'eth',
  format = 'decimal',
  limit = 10,
  cursor = '',
}: SearchNFTsParams): Promise<{ result: NFT[]; cursor: string | null; total: number }> {
  try {
    if (!query) {
      throw new Error('Query parameter is required');
    }

    // Build URL with query parameters
    const url = new URL('/api/moralis/nft/search', window.location.origin);
    url.searchParams.append('query', query);
    url.searchParams.append('chain', chain);
    url.searchParams.append('format', format);
    url.searchParams.append('limit', limit.toString());
    if (cursor) {
      url.searchParams.append('cursor', cursor);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${errorText}`);
    }

    const data = await response.json();

    // Normalize the data to match our NFT interface
    const nfts: NFT[] = data.result.map((nft: any) => {
      let metadata = nft.metadata ? 
        (typeof nft.metadata === 'string' ? JSON.parse(nft.metadata) : nft.metadata) : 
        null;
      
      return {
        tokenId: nft.token_id,
        tokenAddress: nft.token_address,
        name: nft.name || metadata?.name || 'Unnamed NFT',
        symbol: nft.symbol,
        metadata: metadata,
        image: metadata?.image || metadata?.image_url || nft.token_uri,
        chain: chain,
        amount: nft.amount ? parseInt(nft.amount) : undefined,
        owner: nft.owner_of,
        blockNumberMinted: nft.block_number_minted,
        blockTimestamp: nft.block_timestamp,
        contractType: nft.contract_type,
        lastMetadataSync: nft.last_metadata_sync,
        lastTokenUriSync: nft.last_token_uri_sync,
        tokenUri: nft.token_uri,
      };
    });

    return {
      result: nfts,
      cursor: data.cursor || null,
      total: data.total,
    };
  } catch (error) {
    console.error('Error searching NFTs:', error);
    throw error;
  }
}

/**
 * Get details about a specific NFT
 */
export async function getNFTDetails({
  address,
  tokenId,
  chain = 'eth',
  format = 'decimal',
}: GetNFTDetailsParams): Promise<NFT> {
  try {
    if (!address || !tokenId) {
      throw new Error('Address and tokenId parameters are required');
    }

    // Build URL with query parameters
    const url = new URL(`/api/moralis/nft/${address}/${tokenId}`, window.location.origin);
    url.searchParams.append('chain', chain);
    url.searchParams.append('format', format);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${errorText}`);
    }

    const nft = await response.json();
    
    // Parse metadata if it's a string
    let metadata = nft.metadata ? 
      (typeof nft.metadata === 'string' ? JSON.parse(nft.metadata) : nft.metadata) : 
      null;
    
    return {
      tokenId: nft.token_id,
      tokenAddress: nft.token_address,
      name: nft.name || metadata?.name || 'Unnamed NFT',
      symbol: nft.symbol,
      metadata: metadata,
      image: metadata?.image || metadata?.image_url || nft.token_uri,
      chain: chain,
      amount: nft.amount ? parseInt(nft.amount) : undefined,
      owner: nft.owner_of,
      blockNumberMinted: nft.block_number_minted,
      blockTimestamp: nft.block_timestamp,
      contractType: nft.contract_type,
      lastMetadataSync: nft.last_metadata_sync,
      lastTokenUriSync: nft.last_token_uri_sync,
      tokenUri: nft.token_uri,
    };
  } catch (error) {
    console.error('Error getting NFT details:', error);
    throw error;
  }
}

/**
 * Get price history / trades for a specific NFT
 */
export async function getNFTPriceHistory({
  address,
  tokenId,
  chain = 'eth',
  limit = 10,
  cursor = '',
}: GetNFTPriceHistoryParams): Promise<{ result: NFTTrade[]; cursor: string | null }> {
  try {
    if (!address || !tokenId) {
      throw new Error('Address and tokenId parameters are required');
    }

    // Build URL with query parameters
    const url = new URL(`/api/moralis/nft/${address}/${tokenId}/trades`, window.location.origin);
    url.searchParams.append('chain', chain);
    url.searchParams.append('limit', limit.toString());
    if (cursor) {
      url.searchParams.append('cursor', cursor);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${errorText}`);
    }

    const data = await response.json();
    
    // Normalize the data to match our NFTTrade interface
    const trades: NFTTrade[] = data.result.map((trade: any) => ({
      blockNumber: trade.block_number,
      blockTimestamp: trade.block_timestamp,
      transaction: trade.transaction ? {
        hash: trade.transaction.hash,
        from: trade.transaction.from_address,
        to: trade.transaction.to_address,
        value: trade.transaction.value,
      } : undefined,
      price: trade.price,
      priceTokenAddress: trade.price_token_address,
      marketplace: trade.marketplace,
    }));

    return {
      result: trades,
      cursor: data.cursor || null,
    };
  } catch (error) {
    console.error('Error getting NFT price history:', error);
    throw error;
  }
}

/**
 * Get trending NFT collections
 */
export async function getTrendingCollections({
  chain = 'eth',
  limit = 10,
  days = 7,
}: GetTrendingCollectionsParams = {}): Promise<NFTCollection[]> {
  try {
    // Build URL with query parameters
    const url = new URL('/api/moralis/nft/collections/trending', window.location.origin);
    url.searchParams.append('chain', chain);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('days', days.toString());

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${errorText}`);
    }

    const data = await response.json();
    
    // The API returns data in our format
    return data.result;
  } catch (error) {
    console.error('Error getting trending NFT collections:', error);
    throw error;
  }
}

/**
 * Get NFT market data and sentiment analysis
 */
export async function getNFTMarketData({
  chain = 'eth',
  days = 7,
}: GetNFTMarketDataParams = {}): Promise<MarketData> {
  try {
    // Build URL with query parameters
    const url = new URL('/api/moralis/nft/market-data', window.location.origin);
    url.searchParams.append('chain', chain);
    url.searchParams.append('days', days.toString());

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${errorText}`);
    }

    const data = await response.json();
    
    // Convert to our MarketData interface
    return {
      marketSentiment: data.result.market_sentiment,
      averageFloorPriceChange: data.result.average_floor_price_change,
      totalTradingVolume: data.result.total_trading_volume,
      positivePerformingPercent: data.result.positive_performing_percent,
      marketRisk: data.result.market_risk,
      insights: data.result.insights,
    };
  } catch (error) {
    console.error('Error getting NFT market data:', error);
    throw error;
  }
} 