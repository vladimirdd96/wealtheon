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
    
    // Get NFT market data
    // Since Moralis doesn't have a direct endpoint for overall NFT market stats,
    // we'll fetch top collections and aggregate data
    
    // Fetch top collections by volume
    const collectionsResponse = await fetch(
      `https://deep-index.moralis.io/api/v2/nft/collections?limit=20`,
      {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY || '',
        }
      }
    );
    
    if (!collectionsResponse.ok) {
      throw new Error(`Failed to fetch NFT collections: ${collectionsResponse.statusText}`);
    }
    
    const collectionsData = await collectionsResponse.json();
    const collections = collectionsData.result || [];
    
    // Calculate aggregated market metrics
    const totalVolume = collections.reduce((sum: number, collection: any) => {
      const volume = parseFloat(collection.volume_24h || '0');
      return sum + (isNaN(volume) ? 0 : volume);
    }, 0);
    
    const averageMarketCap = collections.reduce((sum: number, collection: any) => {
      const marketCap = parseFloat(collection.market_cap || '0');
      return sum + (isNaN(marketCap) ? 0 : marketCap);
    }, 0) / (collections.length || 1);
    
    // Calculate market sentiment
    // This would be more sophisticated in production
    const risingSentiment = collections.filter((collection: any) => {
      const priceChange = parseFloat(collection.price_change_24h || '0');
      return priceChange > 0;
    }).length;
    
    const marketSentiment = risingSentiment > (collections.length / 2)
      ? 'bullish'
      : risingSentiment === (collections.length / 2)
        ? 'neutral'
        : 'bearish';
    
    // Generate insights
    const insights = [
      {
        title: 'Market Volume',
        value: `${totalVolume.toFixed(2)} ETH`,
        change: '24h',
        trend: totalVolume > 1000 ? 'up' : 'down',
      },
      {
        title: 'Average Collection Value',
        value: `${averageMarketCap.toFixed(2)} ETH`,
        change: '24h',
        trend: averageMarketCap > 500 ? 'up' : 'down',
      },
      {
        title: 'Market Sentiment',
        value: marketSentiment,
        change: '24h',
        trend: marketSentiment === 'bullish' ? 'up' : marketSentiment === 'bearish' ? 'down' : 'neutral',
      },
      {
        title: 'Top Collections',
        value: `${collections.length} tracked`,
        change: '24h',
        trend: 'neutral',
      },
    ];
    
    // Create the final response
    const marketData = {
      marketSentiment,
      averageFloorPriceChange: 0, // Would need historical data to calculate
      totalTradingVolume: totalVolume,
      positivePerformingPercent: (risingSentiment / collections.length) * 100,
      marketRisk: totalVolume > 1000 ? 'low' : 'medium',
      insights,
      topCollections: collections.slice(0, 5).map((collection: any) => ({
        id: collection.token_address || '',
        address: collection.token_address || '',
        name: collection.name || 'Unknown Collection',
        symbol: collection.contract_ticker_symbol || '',
        floorPrice: parseFloat(collection.floor_price || '0'),
        volume24h: parseFloat(collection.volume_24h || '0'),
        marketCap: parseFloat(collection.market_cap || '0'),
        image: collection.logo || '',
      })),
    };
    
    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error fetching NFT market stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch NFT market stats', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 