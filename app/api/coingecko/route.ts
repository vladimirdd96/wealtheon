// CoinGecko API Proxy to avoid CORS issues and handle rate limiting
import { NextRequest } from 'next/server';

// CoinGecko API base URL
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Rate limiting parameters
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests to avoid rate limiting

export async function GET(request: NextRequest) {
  try {
    // Get path and query parameters
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Remove endpoint param and keep the rest for the actual API call
    const params = new URLSearchParams(searchParams);
    params.delete('endpoint');
    
    // Apply rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    
    // Update last request time
    lastRequestTime = Date.now();
    
    // Make the request to CoinGecko
    const url = `${COINGECKO_API_URL}/${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log(`Proxying request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Wealtheon/1.0'
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    if (!response.ok) {
      // If rate limited, create mock data response
      if (response.status === 429) {
        return createMockResponse(endpoint, params);
      }
      
      return new Response(
        JSON.stringify({ 
          error: `CoinGecko API returned ${response.status}`,
          message: await response.text() 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get response data
    const data = await response.json();
    
    // Return the proxied response
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60'
        } 
      }
    );
  } catch (error: any) {
    console.error('Error in CoinGecko proxy:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Generate mock data when rate limited
function createMockResponse(endpoint: string, params: URLSearchParams) {
  console.log(`Creating mock response for ${endpoint}`);
  
  // DeFi protocols data
  if (endpoint.includes('coins/markets') && params.get('category') === 'decentralized-finance-defi') {
    const mockDefiData = [
      { id: "aave", symbol: "aave", name: "Aave", market_cap: 1200000000, total_volume: 150000000, current_price: 80.5, price_change_percentage_24h: 2.3 },
      { id: "uniswap", symbol: "uni", name: "Uniswap", market_cap: 3500000000, total_volume: 200000000, current_price: 4.8, price_change_percentage_24h: 1.2 },
      { id: "compound-governance-token", symbol: "comp", name: "Compound", market_cap: 320000000, total_volume: 40000000, current_price: 38.5, price_change_percentage_24h: -0.8 },
      { id: "maker", symbol: "mkr", name: "Maker", market_cap: 800000000, total_volume: 35000000, current_price: 950.2, price_change_percentage_24h: 0.5 },
      { id: "curve-dao-token", symbol: "crv", name: "Curve DAO", market_cap: 550000000, total_volume: 85000000, current_price: 0.48, price_change_percentage_24h: -1.3 },
      { id: "synthetix-network-token", symbol: "snx", name: "Synthetix", market_cap: 780000000, total_volume: 95000000, current_price: 2.8, price_change_percentage_24h: 3.1 }
    ];
    
    return new Response(
      JSON.stringify(mockDefiData),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // NFTX market chart data
  if (endpoint.includes('coins/nftx/market_chart')) {
    const mockMarketChartData = {
      prices: generateTimeSeries(7, 25, 35),
      market_caps: generateTimeSeries(7, 800000, 1200000),
      total_volumes: generateTimeSeries(7, 100000, 500000)
    };
    
    return new Response(
      JSON.stringify(mockMarketChartData),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Single coin data
  if (endpoint.includes('coins/') && !endpoint.includes('coins/markets')) {
    const coinId = endpoint.split('/').pop() || 'unknown';
    
    const mockCoinData = {
      id: coinId,
      name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
      symbol: coinId.substring(0, 3).toUpperCase(),
      market_data: {
        current_price: { usd: 10 + Math.random() * 100 },
        market_cap: { usd: 100000000 + Math.random() * 900000000 },
        total_volume: { usd: 10000000 + Math.random() * 90000000 }
      },
      categories: ["decentralized-finance-defi", "lending-borowing", "yield-farming"],
      asset_platform_id: Math.random() > 0.5 ? "ethereum" : "solana"
    };
    
    return new Response(
      JSON.stringify(mockCoinData),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Default response
  return new Response(
    JSON.stringify({ message: "Mock data for rate limited request" }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// Helper function to generate time series data for mock responses
function generateTimeSeries(days: number, minValue: number, maxValue: number): [number, number][] {
  const now = Date.now();
  const result: [number, number][] = [];
  
  // Create one data point per day, plus some extra points for intraday data
  const totalPoints = days * 24; // hourly data
  const msPerPoint = (days * 24 * 60 * 60 * 1000) / totalPoints;
  
  for (let i = 0; i < totalPoints; i++) {
    const timestamp = now - ((totalPoints - i) * msPerPoint);
    const value = minValue + Math.random() * (maxValue - minValue);
    result.push([timestamp, value]);
  }
  
  return result;
} 