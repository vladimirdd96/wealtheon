import { NextRequest, NextResponse } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis with API key if not already started
if (!Moralis.Core.isStarted) {
  Moralis.start({
    apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
  });
}

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const chain = searchParams.get('chain') || 'eth';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || null;
    
    // Check required parameters
    if (!address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Check for API key
    if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY) {
      return NextResponse.json({ error: 'Moralis API key is not configured' }, { status: 500 });
    }

    // Get all NFTs owned by the wallet address
    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address,
      chain: chain as any,
      limit,
      cursor: cursor || undefined,
      normalizeMetadata: true,
      mediaItems: true,
    });

    return NextResponse.json(response.toJSON());
  } catch (error) {
    console.error('Error fetching wallet NFTs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch wallet NFTs', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 