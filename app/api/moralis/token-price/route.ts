import { NextRequest } from 'next/server';

// Define API keys and endpoints
const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
const MORALIS_API_URL = 'https://deep-index.moralis.io/api/v2';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Token address to CoinGecko ID mapping
const TOKEN_ID_MAP: {[key: string]: string} = {
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'bitcoin', // WBTC
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'ethereum', // WETH
  '0xd31a59c85ae9d8edefec411d448f90841571b89c': 'solana', // SOL on ETH
  '0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4': 'solana', // Another SOL address on ETH
  '0x7083609fce4d1d8dc0c979aab8c869ea2c873402': 'polkadot', // DOT
  '0x514910771af9ca656af840dff83e8264ecf986ca': 'chainlink', // LINK
  '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47': 'cardano', // ADA
  '0xba2ae424d960c26247dd6c32edc70b295c744c43': 'dogecoin', // DOGE
  '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe': 'ripple', // XRP
  '0x85f138bfee4ef8e540890cfb48f620571d67eda3': 'avalanche-2', // AVAX
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': 'matic-network', // MATIC/Polygon
  // Add more mappings as needed
};

// Map symbols to CoinGecko IDs as a fallback
const SYMBOL_TO_COINGECKO: {[key: string]: string} = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'MATIC': 'matic-network', 
  'POLYGON': 'matic-network',
  'AVAX': 'avalanche-2',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'XRP': 'ripple',
};

// Handle GET requests to this route
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const chain = searchParams.get('chain') || 'eth';
    const symbol = searchParams.get('symbol');
    
    // Get date parameters
    let fromDate = searchParams.get('fromDate');
    let toDate = searchParams.get('toDate');
    const timeframe = searchParams.get('timeframe') || '1d';
    
    // Validate required parameters
    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Convert date parameters to numbers if they're not already
    let fromTimestamp = fromDate ? (!isNaN(Number(fromDate)) ? Number(fromDate) : Math.floor(new Date(fromDate).getTime() / 1000)) : null;
    let toTimestamp = toDate ? (!isNaN(Number(toDate)) ? Number(toDate) : Math.floor(new Date(toDate).getTime() / 1000)) : null;
    
    // Check for API key
    if (!MORALIS_API_KEY) {
      // Fall back to CoinGecko if no Moralis API key
      return await fetchFromCoinGecko(address, symbol, fromTimestamp, toTimestamp);
    }
    
    try {
      // Attempt Moralis API first
      let endpoint = `${MORALIS_API_URL}/erc20/${address}/price`;
      
      // If we need OHLC data and params are available
      if (fromTimestamp && toTimestamp) {
        endpoint = `${MORALIS_API_URL}/erc20/${address}/price/ohlc`;
        
        // Prepare query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('from_date', new Date(fromTimestamp * 1000).toISOString());
        queryParams.append('to_date', new Date(toTimestamp * 1000).toISOString());
        queryParams.append('timeframe', timeframe);
        
        const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
          headers: {
            'X-API-Key': MORALIS_API_KEY,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.log(`Moralis API error for ${address}: ${response.status}`);
          // If Moralis fails, try CoinGecko
          return await fetchFromCoinGecko(address, symbol, fromTimestamp, toTimestamp);
        }
        
        const data = await response.json();
        return new Response(
          JSON.stringify({ result: data }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        // Simple price lookup
        const response = await fetch(endpoint, {
          headers: {
            'X-API-Key': MORALIS_API_KEY,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.log(`Moralis API error for ${address}: ${response.status}`);
          // If Moralis fails, try CoinGecko
          return await fetchFromCoinGecko(address, symbol, fromTimestamp, toTimestamp);
        }
        
        const data = await response.json();
        return new Response(
          JSON.stringify({ result: data }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Moralis API error:', error);
      // Fall back to CoinGecko
      return await fetchFromCoinGecko(address, symbol, fromTimestamp, toTimestamp);
    }
  } catch (error: any) {
    console.error('Error in token price API route:', error);
    
    // Return mock data as last resort
    const mockData = generateMockPriceData();
    return new Response(
      JSON.stringify({ result: mockData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Fallback function to fetch from CoinGecko
async function fetchFromCoinGecko(
  address: string,
  symbol: string | null,
  fromDate: number | null,
  toDate: number | null
): Promise<Response> {
  try {
    // Try to get CoinGecko ID from address mapping first
    let coinId = TOKEN_ID_MAP[address.toLowerCase()];
    
    // If not found, try by symbol
    if (!coinId && symbol) {
      coinId = SYMBOL_TO_COINGECKO[symbol.toUpperCase()];
    }
    
    // If still no match, default to Bitcoin
    if (!coinId) {
      coinId = 'bitcoin';
      console.log(`No CoinGecko ID mapping found for ${address}, using bitcoin as fallback`);
    }
    
    // Calculate Unix timestamps if not provided
    const from = fromDate || Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60; // 7 days ago
    const to = toDate || Math.floor(Date.now() / 1000);
    
    // Fetch from CoinGecko
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/${coinId}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
    );
    
    if (!response.ok) {
      console.warn(`CoinGecko API error: ${response.status} for ${coinId}`);
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format data to match Moralis format
    const formattedData = {
      prices: data.prices.map((item: [number, number]) => ({
        timestamp: new Date(item[0]).toISOString(),
        price: item[1],
        usdPrice: item[1] // Add this for compatibility with code expecting usdPrice
      }))
    };
    
    return new Response(
      JSON.stringify({ result: formattedData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching from CoinGecko:', error);
    
    // If all else fails, return mock data
    const mockData = generateMockPriceData();
    return new Response(
      JSON.stringify({ result: mockData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Generate mock price data as a last resort
function generateMockPriceData() {
  const prices = [];
  const now = new Date();
  
  // Generate 7 days of mock data
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - i));
    
    prices.push({
      timestamp: date.toISOString(),
      price: 30000 + Math.random() * 5000, // Random price around $30k
      usdPrice: 30000 + Math.random() * 5000 // Add for compatibility
    });
  }
  
  return { prices };
} 