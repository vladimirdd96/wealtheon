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
    const chain = searchParams.get('chain') || 'eth';
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Check for API key
    if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY) {
      return NextResponse.json({ error: 'Moralis API key is not configured' }, { status: 500 });
    }

    console.log(`Generating NFT market data for chain: ${chain}`);

    // Generate market sentiment metrics
    // Use random values within realistic ranges to simulate market data
    const totalVolume = Math.random() * 30000 + 10000; // 10000-40000 ETH volume
    const floorPriceChange = (Math.random() * 12) - 6; // -6% to +6% average floor price change
    const positivePerformingPercent = Math.random() * 30 + 40; // 40-70% positive performing
    
    // Determine market sentiment based on floor price change
    let marketSentiment = "Neutral";
    if (floorPriceChange > 4) {
      marketSentiment = "Very Bullish";
    } else if (floorPriceChange > 2) {
      marketSentiment = "Bullish";
    } else if (floorPriceChange < -4) {
      marketSentiment = "Very Bearish";
    } else if (floorPriceChange < -2) {
      marketSentiment = "Bearish";
    }
    
    // Generate risk assessment
    const marketRisk = floorPriceChange < -10 ? "High" : 
                       floorPriceChange < -5 ? "Medium-High" : 
                       floorPriceChange > 10 ? "Medium-High" : 
                       "Medium";
    
    // Generate insights based on data
    const insights = [
      {
        title: "Market Sentiment",
        value: marketSentiment,
        change: floorPriceChange.toFixed(2) + "%",
        trend: floorPriceChange > 0 ? "up" : floorPriceChange < 0 ? "down" : "neutral",
      },
      {
        title: "Trading Volume",
        value: `${Math.floor(totalVolume).toLocaleString()} ETH`,
        change: "",
        trend: "neutral",
      },
      {
        title: "Positive Performing",
        value: positivePerformingPercent.toFixed(1) + "%",
        change: "",
        trend: positivePerformingPercent > 50 ? "up" : "down",
      },
      {
        title: "Market Risk",
        value: marketRisk,
        change: "",
        trend: marketRisk === "High" || marketRisk === "Medium-High" ? "down" : "up",
      },
    ];

    // Generate chart data
    const chartData = [];
    const dataPoints = days <= 7 ? 7 : 30;
    const today = new Date();
    
    // Base sentiment - start with a value around 50 and trend toward current sentiment
    const currentSentiment = 50 + (floorPriceChange * 2);
    let startingSentiment = 50;
    const dailySentimentChange = (currentSentiment - startingSentiment) / dataPoints;
    
    // Base volume - start with a bit less than current and trend upward if sentiment is positive
    let volumeBase = totalVolume * 0.8;
    const dailyVolumeChange = (totalVolume - volumeBase) / dataPoints;
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (dataPoints - 1 - i));
      
      // Add some randomness to sentiment and volume
      startingSentiment += dailySentimentChange + ((Math.random() * 6) - 3);
      volumeBase += dailyVolumeChange * (1 + ((Math.random() * 0.4) - 0.2));
      
      // Ensure sentiment is between 0-100
      const sentiment = Math.max(0, Math.min(100, startingSentiment));
      
      chartData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sentiment: parseFloat(sentiment.toFixed(1)),
        volume: parseFloat(volumeBase.toFixed(1))
      });
    }

    return NextResponse.json({
      result: {
        market_sentiment: marketSentiment,
        average_floor_price_change: floorPriceChange,
        total_trading_volume: totalVolume,
        positive_performing_percent: positivePerformingPercent,
        market_risk: marketRisk,
        insights: insights,
        data: chartData
      }
    });
  } catch (error) {
    console.error('Error generating NFT market data:', error);
    return NextResponse.json({ 
      error: 'Failed to generate NFT market data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 