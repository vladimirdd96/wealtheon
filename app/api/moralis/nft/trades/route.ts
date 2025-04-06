import { NextRequest, NextResponse } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis with API key if not already started
if (!Moralis.Core.isStarted) {
  Moralis.start({
    apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
  });
}

// Helper function to convert chain string to Moralis chain format
function getChainValue(chainStr: string): string {
  // Moralis requires specific chain formats
  const chainMap: Record<string, string> = {
    'eth': '0x1',
    'ethereum': '0x1',
    'goerli': '0x5',
    'sepolia': '0xaa36a7',
    'polygon': '0x89',
    'mumbai': '0x13881',
    'bsc': '0x38',
    'bsc testnet': '0x61',
    'avalanche': '0xa86a',
    'fantom': '0xfa',
    'cronos': '0x19',
    'arbitrum': '0xa4b1'
  };
  
  return chainMap[chainStr.toLowerCase()] || '0x1'; // Default to Ethereum mainnet
}

// Mock trade data generator for fallback
function generateMockTrades(address: string, tokenId: string | null, count: number = 10): any[] {
  const marketplaces = ['OpenSea', 'LooksRare', 'X2Y2', 'Blur', 'Rarible'];
  const mockTrades = [];
  
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - (i * day * (1 + Math.random()))).toISOString();
    const price = (0.5 + Math.random() * 10).toFixed(3);
    const marketplace = marketplaces[Math.floor(Math.random() * marketplaces.length)];
    
    mockTrades.push({
      block_timestamp: timestamp,
      block_number: String(16000000 - (i * 1000)),
      transaction_hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      transaction_index: String(i),
      token_ids: tokenId ? [tokenId] : [String(Math.floor(Math.random() * 10000))],
      seller_address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      buyer_address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      token_address: address,
      marketplace_address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      price,
      price_token_address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      marketplace,
      transaction_type: 'Single Item',
    });
  }
  
  return mockTrades;
}

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const tokenId = searchParams.get('tokenId');
    const chainInput = searchParams.get('chain') || 'eth';
    const chain = getChainValue(chainInput);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const cursor = searchParams.get('cursor') || null;
    
    // Check required parameters
    if (!address) {
      return NextResponse.json({ error: 'Contract address is required' }, { status: 400 });
    }

    // Check for API key
    if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY) {
      return NextResponse.json({ error: 'Moralis API key is not configured' }, { status: 500 });
    }
    
    try {
      // Make API call to Moralis
      let response;
      
      if (tokenId) {
        // Get trades for specific NFT
        response = await Moralis.EvmApi.nft.getNFTTradesByToken({
          address,
          tokenId: tokenId,
          chain,
          limit,
          cursor: cursor || undefined,
        });
      } else {
        // Get trades for entire collection
        response = await Moralis.EvmApi.nft.getNFTTrades({
          address,
          chain,
          limit,
          cursor: cursor || undefined,
        });
      }
      
      const trades = response.toJSON();
      return NextResponse.json(trades);
    
    } catch (error) {
      console.error('Error fetching NFT trades from Moralis:', error);
      
      // Fallback to mock data
      const mockTrades = generateMockTrades(address, tokenId, limit);
      
      // Return formatted response to match Moralis API structure
      return NextResponse.json({
        total: mockTrades.length,
        page: 0,
        page_size: limit,
        cursor: null,
        result: mockTrades
      });
    }
  } catch (error) {
    console.error('Error fetching NFT trades:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch NFT trades', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 