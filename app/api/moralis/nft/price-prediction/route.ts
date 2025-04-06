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
    const tokenId = searchParams.get('tokenId');
    const collectionOnly = searchParams.get('collectionOnly') === 'true';
    const chain = searchParams.get('chain') || 'eth';
    
    // Check required parameters
    if (!address) {
      return NextResponse.json({ error: 'Contract address is required' }, { status: 400 });
    }
    
    if (!collectionOnly && !tokenId) {
      return NextResponse.json({ error: 'Token ID is required for specific NFT price prediction' }, { status: 400 });
    }

    // Check for API key
    if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY) {
      return NextResponse.json({ error: 'Moralis API key is not configured' }, { status: 500 });
    }
    
    // Get trade history for price analysis
    let tradesData: any[] = [];
    
    if (collectionOnly) {
      // Get trades for the whole collection
      const tradesResponse = await Moralis.EvmApi.nft.getNFTTrades({
        address,
        chain: chain as any,
        limit: 100,
      });
      
      tradesData = tradesResponse.toJSON().result || [];
    } else {
      // Get trades for specific NFT
      const tradesResponse = await Moralis.EvmApi.nft.getNFTTradesByToken({
        address,
        tokenId: tokenId as string,
        chain: chain as any,
        limit: 100,
      });
      
      tradesData = tradesResponse.toJSON().result || [];
    }
    
    // Sort trades by timestamp (newest first)
    tradesData.sort((a, b) => {
      const dateA = new Date(a.block_timestamp).getTime();
      const dateB = new Date(b.block_timestamp).getTime();
      return dateB - dateA;
    });
    
    // Calculate current price (from most recent trade)
    const currentPrice = tradesData.length > 0 ? parseFloat(tradesData[0].price) : 0;
    
    // Calculate historical prices for trend analysis
    // Group trades by day and calculate average price
    const dailyPrices: Record<string, number[]> = {};
    
    tradesData.forEach(trade => {
      const date = new Date(trade.block_timestamp);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const price = parseFloat(trade.price);
      
      if (!dailyPrices[dateKey]) {
        dailyPrices[dateKey] = [];
      }
      
      dailyPrices[dateKey].push(price);
    });
    
    // Calculate daily average prices
    const priceHistory = Object.entries(dailyPrices).map(([date, prices]) => ({
      date,
      price: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    }));
    
    // Sort price history by date (oldest first for trend analysis)
    priceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Price prediction logic
    // This is a simple linear regression model
    // In a production environment, you'd use a more sophisticated model
    
    // Get prediction for 7 days
    const prediction7d = predictPrice(priceHistory, 7);
    
    // Get prediction for 30 days
    const prediction30d = predictPrice(priceHistory, 30);
    
    // Create the response
    const predictionData = {
      currentPrice,
      prediction7d,
      prediction30d,
      priceHistory,
      confidence: calculateConfidence(priceHistory),
      trend: determineTrend(priceHistory),
    };
    
    return NextResponse.json(predictionData);
  } catch (error) {
    console.error('Error generating NFT price prediction:', error);
    return NextResponse.json({ 
      error: 'Failed to generate NFT price prediction', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// Helper function to predict future price using linear regression
function predictPrice(priceHistory: { date: string; price: number }[], daysAhead: number): number {
  if (priceHistory.length < 2) {
    return priceHistory.length === 1 ? priceHistory[0].price : 0;
  }
  
  // Convert dates to x-values (days from the first data point)
  const firstDate = new Date(priceHistory[0].date).getTime();
  const xValues = priceHistory.map(point => 
    (new Date(point.date).getTime() - firstDate) / (1000 * 60 * 60 * 24)
  );
  const yValues = priceHistory.map(point => point.price);
  
  // Calculate linear regression
  const n = xValues.length;
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Predict the price
  const lastDay = xValues[xValues.length - 1];
  const predictedPrice = intercept + slope * (lastDay + daysAhead);
  
  // Ensure the price is not negative
  return Math.max(predictedPrice, 0);
}

// Helper function to calculate confidence level
function calculateConfidence(priceHistory: { date: string; price: number }[]): string {
  // In a real system, this would be based on statistical measures like R²
  if (priceHistory.length < 3) return 'Low';
  if (priceHistory.length < 7) return 'Medium';
  return 'High';
}

// Helper function to determine price trend
function determineTrend(priceHistory: { date: string; price: number }[]): string {
  if (priceHistory.length < 2) return 'Stable';
  
  // Calculate overall trend
  const firstPrice = priceHistory[0].price;
  const lastPrice = priceHistory[priceHistory.length - 1].price;
  
  const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  if (percentChange > 10) return 'Rising Strongly';
  if (percentChange > 2) return 'Rising';
  if (percentChange < -10) return 'Falling Strongly';
  if (percentChange < -2) return 'Falling';
  return 'Stable';
} 