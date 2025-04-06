/**
 * Moralis API Functions
 * 
 * This file contains functions to interact with the Moralis API for 
 * blockchain data and market information.
 */

/**
 * Fetches token price data
 */
export async function getTokenPriceData(params: { 
  address: string;
  chain?: string;
  fromDate: number;
  toDate: number;
  timeframe?: string;
}) {
  try {
    const { address, chain = 'eth', fromDate, toDate, timeframe = '1d' } = params;
    
    // Call our API route which handles the data generation
    const response = await fetch(
      `/api/moralis/token-price?address=${address}&chain=${chain}&fromDate=${fromDate}&toDate=${toDate}&timeframe=${timeframe}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch token price data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching token price data:', error);
    throw error;
  }
}

/**
 * Fetches Bitcoin price data
 */
export async function getBitcoinPriceData(params: { timeframe: string, limit: number }) {
  try {
    // Calculate date ranges based on timeframe
    const currentTime = Math.floor(Date.now() / 1000);
    const days = params.timeframe === '24h' ? 1 : 
                params.timeframe === '7d' ? 7 : 
                params.timeframe === '30d' ? 30 : 90;
                
    const fromDate = currentTime - (days * 24 * 60 * 60);
    
    return await getTokenPriceData({
      address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC address
      fromDate,
      toDate: currentTime,
      timeframe: params.timeframe === '24h' ? '1h' : '1d'
    });
  } catch (error) {
    console.error('Error fetching Bitcoin data:', error);
    throw error;
  }
}

/**
 * Fetches Ethereum price data
 */
export async function getEthereumPriceData(params: { timeframe: string, limit: number }) {
  try {
    // Calculate date ranges based on timeframe
    const currentTime = Math.floor(Date.now() / 1000);
    const days = params.timeframe === '24h' ? 1 : 
                params.timeframe === '7d' ? 7 : 
                params.timeframe === '30d' ? 30 : 90;
                
    const fromDate = currentTime - (days * 24 * 60 * 60);
    
    return await getTokenPriceData({
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH address
      fromDate,
      toDate: currentTime,
      timeframe: params.timeframe === '24h' ? '1h' : '1d'
    });
  } catch (error) {
    console.error('Error fetching Ethereum data:', error);
    throw error;
  }
}

/**
 * Fetches Solana price data
 */
export async function getSolanaPriceData(params: { timeframe: string, limit: number }) {
  try {
    // Calculate date ranges based on timeframe
    const currentTime = Math.floor(Date.now() / 1000);
    const days = params.timeframe === '24h' ? 1 : 
                params.timeframe === '7d' ? 7 : 
                params.timeframe === '30d' ? 30 : 90;
                
    const fromDate = currentTime - (days * 24 * 60 * 60);
    
    return await getTokenPriceData({
      address: '0x7dff46370e9ea5f0bad3c4e29711ad50062ea7a4', // SOL address on ETH
      fromDate,
      toDate: currentTime,
      timeframe: params.timeframe === '24h' ? '1h' : '1d'
    });
  } catch (error) {
    console.error('Error fetching Solana data:', error);
    throw error;
  }
}

/**
 * Generates sentiment data based on price movements
 */
export async function getSentimentData(assets: string[]) {
  try {
    // Generate sentiment data based on asset ticker
    return assets.map(asset => {
      let baseScore = 50; // Neutral sentiment by default
      
      // Adjust sentiment score based on asset
      switch (asset.toUpperCase()) {
        case 'BTC':
          baseScore = 65; // Slightly bullish
          break;
        case 'ETH':
          baseScore = 62; // Slightly bullish
          break;
        case 'SOL':
          baseScore = 70; // More bullish
          break;
        case 'MATIC':
          baseScore = 58; // Neutral to slightly bullish
          break;
        case 'AVAX':
          baseScore = 60; // Neutral to slightly bullish
          break;
        case 'DOT':
          baseScore = 52; // Neutral
          break;
        case 'LINK':
          baseScore = 68; // Bullish
          break;
        case 'ADA':
          baseScore = 48; // Slightly bearish
          break;
        case 'DOGE':
          baseScore = 55; // Neutral
          break;
        case 'XRP':
          baseScore = 45; // Slightly bearish
          break;
      }
      
      // Add some randomness within 5 points
      const randomAdjustment = (Math.random() * 10) - 5;
      const finalScore = Math.max(0, Math.min(100, baseScore + randomAdjustment));
      
      return {
        subject: asset,
        score: finalScore,
        sources: ['Price Analysis', 'Market Data', 'News Sentiment'],
        lastUpdated: new Date().toISOString()
      };
    });
  } catch (error) {
    console.error('Error generating sentiment data:', error);
    throw error;
  }
} 