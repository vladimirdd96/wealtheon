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
  { params }: { params: { params: string[] } }
) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Fix for Next.js 15+ - await the entire params object first
    const awaitedParams = await params;
    const path = Array.isArray(awaitedParams.params) ? awaitedParams.params.join('/') : '';
    
    // Mock data responses since Moralis API is not working correctly
    // This allows the UI to function while API issues are resolved
    
    if (path.includes('btcusd/ohlc')) {
      // Return mock BTC data
      return Response.json(generateMockOHLCVData('BTC', 30000, 45000, parseInt(searchParams.get('limit') || '30')));
    } 
    else if (path.includes('ethusd/ohlc')) {
      // Return mock ETH data
      return Response.json(generateMockOHLCVData('ETH', 2000, 3500, parseInt(searchParams.get('limit') || '30')));
    } 
    else if (path.includes('solusd/ohlc')) {
      // Return mock SOL data
      return Response.json(generateMockOHLCVData('SOL', 80, 160, parseInt(searchParams.get('limit') || '30')));
    } 
    else if (path.includes('tokens/top')) {
      // Return mock top tokens data
      return Response.json({
        tokens: [
          { symbol: 'BTC', name: 'Bitcoin', marketCap: '1200000000000' },
          { symbol: 'ETH', name: 'Ethereum', marketCap: '500000000000' },
          { symbol: 'SOL', name: 'Solana', marketCap: '80000000000' },
          { symbol: 'BNB', name: 'Binance Coin', marketCap: '70000000000' },
          { symbol: 'ADA', name: 'Cardano', marketCap: '30000000000' }
        ]
      });
    } 
    else {
      throw new Error(`Unsupported market data endpoint: ${path}`);
    }
    
    /* Real API integration - commented out until Moralis API issues are resolved
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
    
    // Check response status before parsing JSON
    if (!response.ok) {
      // Handle error responses
      const errorText = await response.text();
      console.error('Moralis API returned an error:', response.status, errorText);
      return Response.json({ error: `API Error: ${response.status}` }, { status: response.status });
    }
    
    const data = await response.json();
    return Response.json(data);
    */
    
  } catch (error: any) {
    console.error('Moralis API error:', error);
    return Response.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}

// Helper function to generate mock OHLCV data
function generateMockOHLCVData(symbol: string, minPrice: number, maxPrice: number, count: number) {
  const currentDate = new Date();
  const data = [];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(currentDate.getDate() - (count - i - 1));
    
    // Generate price within range with some randomness but trending upward
    const factor = i / count; // 0 to 1 factor for trending
    const basePrice = minPrice + (maxPrice - minPrice) * factor;
    const variation = (Math.random() - 0.3) * (maxPrice - minPrice) * 0.1;
    const price = basePrice + variation;
    
    // Calculate high, low, open based on close price
    const high = price * (1 + Math.random() * 0.05);
    const low = price * (1 - Math.random() * 0.05);
    const open = low + Math.random() * (high - low);
    const volume = Math.floor(Math.random() * 100000) + 50000;
    
    data.push({
      timestamp: Math.floor(date.getTime() / 1000),
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: price.toFixed(2),
      volume: volume.toString()
    });
  }
  
  return data;
} 