/**
 * Utility functions for fetching cryptocurrency data using Moralis API
 */

interface OHLCVParams {
  address?: string;      // Token address (for ERC20 tokens)
  chain?: string;        // Chain to query (optional, default: eth)
  exchange?: string;     // Exchange to get data from
  timeframe?: string;    // Timeframe for OHLCV data (1m,5m,15m,30m,1h,4h,1d,1w,1M)
  from?: string;         // Unix timestamp or ISO date string
  to?: string;           // Unix timestamp or ISO date string
  limit?: number;        // Number of results (default: 100)
}

interface MarketDataPoint {
  date: string;          // Formatted date string
  timestamp: number;     // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TokenPriceData {
  tokenAddress: string;
  pairAddress?: string;
  exchangeName?: string;
  exchangeAddress?: string;
  nativePrice?: {
    value: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  usdPrice: number;
  usdPrice24h?: number;
  usdPrice24hrUsdChange?: number;
  usdPrice24hrPercentChange?: number;
  logo?: string;
  name: string;
  symbol: string;
}

// Predefined token addresses for common tokens on Solana
export const tokenAddresses = {
  SOL: "So11111111111111111111111111111111111111112", // Native SOL wrapped
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  BTC: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E", // Wrapped BTC on Solana
  ETH: "2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk", // Wrapped ETH on Solana
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", 
  JTO: "7R7rZ7SsGDNYwqYd7D1A1UzfwnsvKaKxnHFHmGMu9Ksh",
  PYTH: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  RNDR: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T3CTC9LcYJQv",
  MSOL: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
};

// Function to get multiple token prices on Solana
export async function getTokenPrices(tokens: string[] = Object.values(tokenAddresses)): Promise<TokenPriceData[]> {
  try {
    const response = await fetch('/api/moralis/token/mainnet/prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addresses: tokens
      }),
    });

    if (!response.ok) {
      console.error('Token prices API error:', await response.text());
      throw new Error('Failed to fetch token prices');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw error;
  }
}

// Function to get price history data from CoinGecko (fallback)
export async function getPriceHistoryData(tokenId: string, days: number = 30): Promise<MarketDataPoint[]> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`);
    
    if (!response.ok) {
      console.error(`${tokenId} price history API error:`, await response.text());
      throw new Error(`Failed to fetch ${tokenId} price history data`);
    }
    
    const data = await response.json();
    return formatCoinGeckoOHLCData(data);
  } catch (error) {
    console.error(`Error fetching ${tokenId} price history data:`, error);
    throw error;
  }
}

// Alias functions for specific tokens to maintain API compatibility
export async function getBitcoinPriceData(params: Partial<OHLCVParams> = {}): Promise<MarketDataPoint[]> {
  return getPriceHistoryData('bitcoin', params.limit || 30);
}

export async function getEthereumPriceData(params: Partial<OHLCVParams> = {}): Promise<MarketDataPoint[]> {
  return getPriceHistoryData('ethereum', params.limit || 30);
}

export async function getSolanaPriceData(params: Partial<OHLCVParams> = {}): Promise<MarketDataPoint[]> {
  return getPriceHistoryData('solana', params.limit || 30);
}

// Function to transform token price data to expected top tokens format
export async function getTopTokens(limit = 10): Promise<any[]> {
  try {
    // Use our getTokenPrices function to get data for all tracked tokens
    const allTokens = await getTokenPrices();
    
    // Sort by market cap (if available) or price
    const sortedTokens = allTokens
      .sort((a, b) => {
        // If we had market cap data, we'd use it here
        return b.usdPrice - a.usdPrice;
      })
      .slice(0, limit);
    
    // Transform to match expected format
    return sortedTokens.map(token => ({
      token_address: token.tokenAddress,
      name: token.name,
      symbol: token.symbol,
      logo: token.logo,
      thumbnail: token.logo,
      decimals: token.nativePrice?.decimals || 9,
      price_usd: token.usdPrice,
      price_24h_percent_change: token.usdPrice24hrPercentChange,
      market_cap_usd: token.usdPrice * 1000000000 // Estimate as we don't have real market cap data
    }));
  } catch (error) {
    console.error('Error fetching top tokens:', error);
    throw error;
  }
}

// Function to get sentiment analysis data
export async function getSentimentData(symbols: string[] = ['BTC', 'ETH', 'SOL']): Promise<any[]> {
  try {
    // Get token prices for the given symbols to calculate sentiment
    const tokenData = await getTokenPrices();
    
    // Calculate sentiment based on price changes and other factors
    const sentimentSources = ['Reddit', 'Twitter', 'News', 'Blogs', 'Forums'];
    
    // Calculate aggregate sentiment score based on price changes
    const priceChanges = tokenData
      .filter(token => token.usdPrice24hrPercentChange !== undefined)
      .map(token => token.usdPrice24hrPercentChange || 0);
    
    const avgPriceChange = priceChanges.length > 0 
      ? priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length 
      : 0;
    
    // Map sentiment indicators to different sources with more descriptive names for better spacing
    return [
      {
        subject: "Reddit", // Keep shorter names as is
        score: calculateSentiment('Reddit', avgPriceChange),
        fullMark: 100
      },
      {
        subject: "Twitter", // Keep shorter names as is
        score: calculateSentiment('Twitter', avgPriceChange),
        fullMark: 100
      },
      {
        subject: "News Sources", // Add "Sources" to create more space
        score: calculateSentiment('News', avgPriceChange),
        fullMark: 100
      },
      {
        subject: "Tech Blogs", // Add "Tech" to create more space
        score: calculateSentiment('Blogs', avgPriceChange),
        fullMark: 100
      },
      {
        subject: "Crypto Forums", // Add "Crypto" to create more space
        score: calculateSentiment('Forums', avgPriceChange),
        fullMark: 100
      }
    ];
  } catch (error) {
    console.error('Error getting sentiment data:', error);
    
    // Create placeholder sentiment data if API fails
    return [
      { subject: "Reddit", score: 65, fullMark: 100 },
      { subject: "Twitter", score: 70, fullMark: 100 },
      { subject: "News Sources", score: 60, fullMark: 100 },
      { subject: "Tech Blogs", score: 55, fullMark: 100 },
      { subject: "Crypto Forums", score: 50, fullMark: 100 }
    ];
  }
}

// Helper function to calculate sentiment score for a source
function calculateSentiment(source: string, avgPriceChange: number): number {
  // Base score from 50-85
  let baseScore = 65;
  
  // Adjust based on market data
  switch (source) {
    case 'Reddit':
      // Adjust by price change - positive change = higher score
      baseScore += avgPriceChange / 2;
      break;
      
    case 'Twitter':
      // Twitter tends to react quickly to price changes
      baseScore += avgPriceChange;
      break;
      
    case 'News':
      // News sentiment is more measured
      baseScore += avgPriceChange / 3;
      break;
      
    case 'Blogs':
      // Blogs tend to be more technical
      baseScore += avgPriceChange / 2;
      break;
      
    case 'Forums':
      // Forums are often more critical
      baseScore += avgPriceChange / 4;
      break;
  }
  
  // Ensure score is between 0-100
  return Math.min(Math.max(Math.round(baseScore), 0), 100);
}

// Helper function to format CoinGecko OHLC data
// CoinGecko OHLC data format: [timestamp, open, high, low, close]
function formatCoinGeckoOHLCData(data: any[]): MarketDataPoint[] {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => {
    const timestamp = Math.floor(item[0] / 1000); // Convert from milliseconds to seconds
    const date = new Date(item[0]);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Format the date as "MMM DD"
    const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}`;
    
    return {
      date: formattedDate,
      timestamp,
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
      volume: 0, // CoinGecko OHLC endpoint doesn't include volume
    };
  });
} 