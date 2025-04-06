import { NextRequest, NextResponse } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis
if (!Moralis.Core.isStarted) {
  Moralis.start({
    apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract address and protocol from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // For path /api/moralis/wallets/[address]/defi/[protocol]/positions, 
    // the address will be at position 4 and protocol at position 6
    const address = pathParts[4];
    const protocol = pathParts[6];
    
    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!protocol) {
      return NextResponse.json(
        { error: 'Protocol is required' },
        { status: 400 }
      );
    }

    // Check if it's a Solana address (starts with a letter or has a length of 32-44 chars)
    const isSolanaAddress = /^[A-Za-z]/.test(address) || (address.length >= 32 && address.length <= 44);
    
    if (isSolanaAddress) {
      // For now, return empty data for Solana as Moralis DeFi API doesn't support it
      return NextResponse.json([]);
    }

    // Call Moralis DeFi API to get positions for specific protocol
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/wallets/${address}/defi/${protocol}/positions`,
      {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY || '',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Moralis API error:', errorData);
      return NextResponse.json(
        { error: `Failed to fetch ${protocol} positions from Moralis` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error in protocol positions API route:`, error);
    return NextResponse.json(
      { error: `Failed to fetch protocol positions` },
      { status: 500 }
    );
  }
} 