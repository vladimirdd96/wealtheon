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
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Check for API key
    if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY) {
      return NextResponse.json({ error: 'Moralis API key is not configured' }, { status: 500 });
    }

    // Get the top NFT collections by market cap
    // Moralis.EvmApi.nft.getTopNFTCollectionsByMarketCap doesn't exist, use direct API call
    const collectionsResponse = await fetch(
      `https://deep-index.moralis.io/api/v2/nft/collections?limit=${limit}`,
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
    
    // Transform the response to match our NFTCollection interface
    const transformedCollections = collections.map((collection: any) => ({
      id: collection.token_address,
      address: collection.token_address,
      name: collection.name || 'Unknown Collection',
      symbol: collection.contract_ticker_symbol || '',
      chain,
      totalSupply: parseInt(collection.contract_total_supply) || 0,
      items: parseInt(collection.items) || 0,
      owners: parseInt(collection.owners) || 0,
      floorPrice: parseFloat(collection.floor_price_usd) / 1800, // Convert USD to approx ETH
      volume24h: parseFloat(collection.volume_24h_usd) / 1800, // Convert USD to approx ETH
      volume7d: parseFloat(collection.volume_7d_usd) / 1800, // Convert USD to approx ETH
      priceChange24h: parseFloat(collection.all_time_price_change_percentage) || 0,
      priceChange7d: parseFloat(collection.all_time_price_change_percentage) || 0, // Using all-time as 7d isn't directly available
      marketCap: parseFloat(collection.market_cap_usd) / 1800, // Convert USD to approx ETH
      ownershipConcentration: getOwnershipConcentration(parseInt(collection.owners), parseInt(collection.items)),
      risk: getRiskAssessment(collection),
      image: collection.logo_url || null
    }));

    return NextResponse.json(transformedCollections);
  } catch (error) {
    console.error('Error fetching trending collections:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch trending collections', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// Helper function to determine ownership concentration
function getOwnershipConcentration(owners: number, items: number): string {
  if (!owners || !items) return 'Unknown';
  
  const ratio = owners / items;
  if (ratio > 0.8) return 'Very Low';
  if (ratio > 0.5) return 'Low';
  if (ratio > 0.3) return 'Medium';
  if (ratio > 0.1) return 'High';
  return 'Very High';
}

// Helper function to determine risk assessment
function getRiskAssessment(collection: any): string {
  // Calculate a risk score based on various factors
  let riskScore = 0;
  
  // Age factor - newer collections are higher risk
  if (collection.age_in_days < 30) {
    riskScore += 3;
  } else if (collection.age_in_days < 90) {
    riskScore += 2;
  } else if (collection.age_in_days < 180) {
    riskScore += 1;
  }
  
  // Volume factor - higher volume means lower risk
  const volume = parseFloat(collection.volume_7d_usd);
  if (volume > 1000000) {
    riskScore -= 2;
  } else if (volume > 100000) {
    riskScore -= 1;
  } else if (volume < 10000) {
    riskScore += 1;
  }
  
  // Market cap factor - higher market cap means lower risk
  const marketCap = parseFloat(collection.market_cap_usd);
  if (marketCap > 10000000) {
    riskScore -= 2;
  } else if (marketCap > 1000000) {
    riskScore -= 1;
  } else if (marketCap < 100000) {
    riskScore += 1;
  }
  
  // Ownership concentration - more distributed ownership is lower risk
  const owners = parseInt(collection.owners);
  const items = parseInt(collection.items);
  const ownerRatio = owners / items;
  if (ownerRatio > 0.5) {
    riskScore -= 2;
  } else if (ownerRatio > 0.3) {
    riskScore -= 1;
  } else if (ownerRatio < 0.1) {
    riskScore += 2;
  }
  
  // Map the risk score to a risk level
  if (riskScore <= -3) return 'Low';
  if (riskScore <= -1) return 'Medium-Low';
  if (riskScore <= 1) return 'Medium';
  if (riskScore <= 3) return 'Medium-High';
  return 'High';
} 