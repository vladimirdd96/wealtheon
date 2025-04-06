import { NextRequest } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis with API key
if (!Moralis.Core.isStarted) {
  Moralis.start({
    apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get path from params
    const awaitedParams = await params;
    const path = awaitedParams.params.join('/');
    
    let endpoint = '';
    
    // Handle different endpoints for market data
    if (path.includes('ohlc')) {
      // For OHLCV data of tokens like BTC, ETH, SOL
      const [pair, dataType] = path.split('/');
      
      if (dataType === 'ohlc') {
        // Convert pair format (e.g., btcusd to proper tokens)
        let baseToken, quoteToken;
        
        if (pair.toLowerCase() === 'btcusd') {
          baseToken = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'; // WBTC token address
          quoteToken = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC token address
        } else if (pair.toLowerCase() === 'ethusd') {
          baseToken = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH token address
          quoteToken = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC token address
        } else if (pair.toLowerCase() === 'solusd') {
          baseToken = '0xD31a59c85aE9D8edEFeC411D448f90841571b89c'; // SOL token on ETH
          quoteToken = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC token address
        } else {
          throw new Error(`Unsupported token pair: ${pair}`);
        }
        
        endpoint = `https://deep-index.moralis.io/api/v2/erc20/${baseToken}/price/tokens/${quoteToken}/ohlc`;
      }
    } else if (path.includes('tokens/top')) {
      // For top tokens by market cap
      endpoint = 'https://deep-index.moralis.io/api/v2/market-data/tokens/top';
    } else {
      throw new Error(`Unsupported market data endpoint: ${path}`);
    }
    
    // Make the request to Moralis
    const response = await fetch(`${endpoint}?${searchParams.toString()}`, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY || '',
        'Accept': 'application/json',
      },
    });
    
    // Return the response directly to avoid any transformation issues
    return response;
    
  } catch (error: any) {
    console.error('Moralis API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process request' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 