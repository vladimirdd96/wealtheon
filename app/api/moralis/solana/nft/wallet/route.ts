import { NextRequest, NextResponse } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis
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
    const network = searchParams.get('network') || 'mainnet';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    
    // Check required parameters
    if (!address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Check for API key
    if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY) {
      return NextResponse.json({ error: 'Moralis API key is not configured' }, { status: 500 });
    }
    
    try {
      // Get NFTs using Moralis Solana API
      const response = await Moralis.SolApi.account.getNFTs({
        address,
        network,
      });
      
      return NextResponse.json(response.toJSON());
    } catch (error: any) {
      console.error('Error fetching Solana NFTs from Moralis:', error);
      
      // If it's a 404, return empty result instead of error
      if (error.message && (error.message.includes('404') || error.details?.status === 404)) {
        return NextResponse.json({ result: [] });
      }
      
      // For other errors, return error response
      return NextResponse.json({ 
        error: 'Failed to fetch Solana NFTs',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in Solana NFTs API route:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 