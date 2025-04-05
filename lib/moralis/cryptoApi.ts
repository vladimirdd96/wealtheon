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

// Function to get OHLCV data for BTC (Bitcoin)
export async function getBitcoinPriceData(params: Partial<OHLCVParams> = {}): Promise<MarketDataPoint[]> {
  try {
    const timeframe = params.timeframe || '1d';
    const limit = params.limit || 30;
    const to = params.to || Math.floor(Date.now() / 1000).toString();
    
    // For Bitcoin we use the /token/price endpoint with USD as the currency
    const queryParams = new URLSearchParams({
      chain: 'eth',
      exchange: 'uniswap-v3',
      timeframe,
      limit: limit.toString(),
      to,
      ...(params.from && { from: params.from }),
    });
    
    const response = await fetch(`/api/moralis/market-data/btcusd/ohlc?${queryParams.toString()}`);
    if (!response.ok) {
      console.error('Bitcoin API error:', await response.text());
      throw new Error('Failed to fetch Bitcoin price data');
    }
    
    const data = await response.json();
    return formatOHLCVData(data);
  } catch (error) {
    console.error('Error fetching Bitcoin price data:', error);
    throw error;
  }
}

// Function to get OHLCV data for ETH (Ethereum)
export async function getEthereumPriceData(params: Partial<OHLCVParams> = {}): Promise<MarketDataPoint[]> {
  try {
    const timeframe = params.timeframe || '1d';
    const limit = params.limit || 30;
    const to = params.to || Math.floor(Date.now() / 1000).toString();
    
    const queryParams = new URLSearchParams({
      chain: 'eth',
      exchange: 'uniswap-v3',
      timeframe,
      limit: limit.toString(),
      to,
      ...(params.from && { from: params.from }),
    });
    
    const response = await fetch(`/api/moralis/market-data/ethusd/ohlc?${queryParams.toString()}`);
    if (!response.ok) {
      console.error('Ethereum API error:', await response.text());
      throw new Error('Failed to fetch Ethereum price data');
    }
    
    const data = await response.json();
    return formatOHLCVData(data);
  } catch (error) {
    console.error('Error fetching Ethereum price data:', error);
    throw error;
  }
}

// Function to get OHLCV data for SOL (Solana)
export async function getSolanaPriceData(params: Partial<OHLCVParams> = {}): Promise<MarketDataPoint[]> {
  try {
    const timeframe = params.timeframe || '1d';
    const limit = params.limit || 30;
    const to = params.to || Math.floor(Date.now() / 1000).toString();
    
    const queryParams = new URLSearchParams({
      chain: 'eth', // Even for Solana prices, we often use ERC20 representations
      exchange: 'uniswap-v3',
      timeframe,
      limit: limit.toString(),
      to,
      ...(params.from && { from: params.from }),
    });
    
    const response = await fetch(`/api/moralis/market-data/solusd/ohlc?${queryParams.toString()}`);
    if (!response.ok) {
      console.error('Solana API error:', await response.text());
      throw new Error('Failed to fetch Solana price data');
    }
    
    const data = await response.json();
    return formatOHLCVData(data);
  } catch (error) {
    console.error('Error fetching Solana price data:', error);
    throw error;
  }
}

// Function to get top tokens by market cap
export async function getTopTokens(limit = 10): Promise<any[]> {
  try {
    const response = await fetch(`/api/moralis/market-data/tokens/top?limit=${limit}`);
    if (!response.ok) {
      console.error('Top tokens API error:', await response.text());
      throw new Error('Failed to fetch top tokens');
    }
    
    const data = await response.json();
    return data.tokens || [];
  } catch (error) {
    console.error('Error fetching top tokens:', error);
    throw error;
  }
}

// Function to get sentiment analysis data
// Note: This is a simulated function that generates data based on price trends
export async function getSentimentData(symbols: string[] = ['BTC', 'ETH', 'SOL']): Promise<any[]> {
  try {
    // Fetch price data to calculate volatility-based sentiment
    const [btcData, ethData, solData] = await Promise.all([
      getBitcoinPriceData({ limit: 7, timeframe: '1d' }).catch(() => []),
      getEthereumPriceData({ limit: 7, timeframe: '1d' }).catch(() => []),
      getSolanaPriceData({ limit: 7, timeframe: '1d' }).catch(() => []),
    ]);
    
    // Calculate volatility (simple implementation: range over mean)
    const calculateVolatility = (data: MarketDataPoint[]) => {
      if (data.length < 2) return 0;
      const prices = data.map(point => point.close);
      const max = Math.max(...prices);
      const min = Math.min(...prices);
      const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      return ((max - min) / mean) * 100;
    };
    
    // Map volatility to sentiment sources
    const sentimentSources = ['Reddit', 'Twitter', 'News', 'Blogs', 'Forums'];
    const btcVolatility = calculateVolatility(btcData);
    const ethVolatility = calculateVolatility(ethData);
    const solVolatility = calculateVolatility(solData);
    
    // Generate sentiment scores (higher volatility = mixed sentiment)
    // This is just a simplification - real sentiment would come from NLP analysis
    return sentimentSources.map(source => {
      // Base score - randomized but with constraints
      const baseScore = 60 + Math.floor(Math.random() * 25);
      
      // Adjust based on source and volatility (simplified logic)
      let adjustment = 0;
      if (source === 'Reddit' || source === 'Twitter') {
        // Social media tends to be more volatile
        adjustment = (btcVolatility + ethVolatility + solVolatility) / 30;
      } else if (source === 'News') {
        // News tends to be more measured
        adjustment = (btcVolatility + ethVolatility + solVolatility) / 50;
      }
      
      // Apply adjustment (positive for up trend, negative for down trend)
      // For simplicity, we'll use a simple price change check
      const btcTrend = btcData.length > 1 ? 
        (btcData[btcData.length - 1].close > btcData[0].close ? 1 : -1) : 0;
      
      return {
        subject: source,
        score: Math.min(Math.max(baseScore + (adjustment * btcTrend), 0), 100), // Keep between 0-100
        fullMark: 100
      };
    });
  } catch (error) {
    console.error('Error generating sentiment data:', error);
    
    // Generate fallback sentiment data
    return [
      { subject: "Reddit", score: 60 + Math.floor(Math.random() * 30), fullMark: 100 },
      { subject: "Twitter", score: 55 + Math.floor(Math.random() * 35), fullMark: 100 },
      { subject: "News", score: 60 + Math.floor(Math.random() * 20), fullMark: 100 },
      { subject: "Blogs", score: 65 + Math.floor(Math.random() * 25), fullMark: 100 },
      { subject: "Forums", score: 55 + Math.floor(Math.random() * 30), fullMark: 100 },
    ];
  }
}

// Helper function to format OHLCV data for use in charts
function formatOHLCVData(data: any[]): MarketDataPoint[] {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => {
    // Handle string or number timestamp
    const timestamp = typeof item.timestamp === 'string' 
      ? parseInt(item.timestamp) 
      : item.timestamp;
    
    const date = new Date(timestamp * 1000);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Format the date as "MMM DD" 
    const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}`;
    
    // Parse numeric values, ensuring they're numbers
    return {
      date: formattedDate,
      timestamp,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume || '0'),
    };
  });
} 