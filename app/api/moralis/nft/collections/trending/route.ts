import { NextRequest, NextResponse } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis with API key if not already started
if (!Moralis.Core.isStarted) {
  Moralis.start({
    apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
  });
}

// Define the type for our enriched collection
interface EnrichedCollection {
  id: string;
  address: string;
  name: string;
  symbol: string;
  chain: string;
  totalSupply: number | null;
  items: number | null;
  owners: number | null;
  floorPrice: number | null;
  volume24h: number | null;
  volume7d: number | null;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number | null;
  ownershipConcentration: string;
  risk: string;
  priceHistory: Array<any>;
  image: string | null;
}

// Popular NFT collections with their contract addresses
const POPULAR_COLLECTIONS = [
  { address: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d", name: "Bored Ape Yacht Club", symbol: "BAYC" },
  { address: "0x60e4d786628fea6478f785a6d7e704777c86a7c6", name: "Mutant Ape Yacht Club", symbol: "MAYC" },
  { address: "0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258", name: "Otherdeed for Otherside", symbol: "OTHR" },
  { address: "0xed5af388653567af2f388e6224dc7c4b3241c544", name: "Azuki", symbol: "AZUKI" },
  { address: "0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b", name: "Clone X", symbol: "CLONEX" },
  { address: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e", name: "Doodles", symbol: "DOODLE" },
  { address: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb", name: "CryptoPunks", symbol: "PUNK" },
  { address: "0x23581767a106ae21c074b2276d25e5c3e136a68b", name: "Moonbirds", symbol: "MOONBIRD" },
  { address: "0x79fcdef22feed20eddacbb2587640e45491b757f", name: "mfer", symbol: "MFER" },
  { address: "0x394e3d3044fc89fcdd966d3cb35ac0b32b0cda91", name: "Renga", symbol: "RENGA" },
  { address: "0x1a92f7381b9f03921564a437210bb9396471050c", name: "Cool Cats", symbol: "COOL" },
  { address: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8", name: "Pudgy Penguins", symbol: "PPG" }
];

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'eth';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Check for API key
    if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY) {
      return NextResponse.json({ error: 'Moralis API key is not configured' }, { status: 500 });
    }

    console.log(`Generating trending NFT collections for chain: ${chain}`);

    // Create enriched collections with simulated data
    const collections: EnrichedCollection[] = POPULAR_COLLECTIONS.slice(0, limit).map((collection, index) => {
      // Generate some realistic random values
      const floorPrice = Math.random() * 50 + (index === 0 ? 50 : index === 1 ? 30 : 1); // Higher floor price for top collections
      const priceChange24h = (Math.random() * 16) - 8; // Range from -8% to +8%
      const priceChange7d = (Math.random() * 30) - 15; // Range from -15% to +15%
      const volume24h = floorPrice * (Math.random() * 50 + 10); // Reasonable volume based on floor price
      const volume7d = volume24h * (Math.random() * 3 + 4); // Weekly volume about 4-7x daily volume
      const totalSupply = Math.floor(Math.random() * 5000) + 5000; // Between 5000-10000 items
      const owners = Math.floor(totalSupply * (Math.random() * 0.3 + 0.3)); // 30-60% of supply owned
      const marketCap = floorPrice * totalSupply;
      
      // Generate price history
      const priceHistory = [];
      let currentPrice = floorPrice * 0.8; // Start with a price about 80% of current floor
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (30 - i));
        
        // Add some randomness but with a trend toward current price
        const dailyChange = ((floorPrice - currentPrice) / (30 - i)) * (Math.random() * 0.5 + 0.75);
        currentPrice += dailyChange;
        
        priceHistory.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: currentPrice
        });
      }
      
      // Determine risk based on price volatility and age
      const volatility = Math.abs(priceChange7d) + Math.abs(priceChange24h);
      let risk;
      if (index < 3) {
        risk = volatility > 20 ? "Medium" : "Low"; // Top collections are generally lower risk
      } else if (volatility > 25) {
        risk = "High";
      } else if (volatility > 15) {
        risk = "Medium-High";
      } else if (volatility > 8) {
        risk = "Medium";
      } else {
        risk = "Low";
      }
      
      // Determine ownership concentration
      const ownershipRatio = owners / totalSupply;
      let ownershipConcentration;
      if (ownershipRatio < 0.35) {
        ownershipConcentration = "High"; // Few owners relative to supply
      } else if (ownershipRatio < 0.45) {
        ownershipConcentration = "Medium";
      } else {
        ownershipConcentration = "Low"; // Many different owners
      }
      
      return {
        id: collection.address,
        address: collection.address,
        name: collection.name,
        symbol: collection.symbol,
        chain: chain,
        totalSupply: totalSupply,
        items: totalSupply,
        owners: owners,
        floorPrice: floorPrice,
        volume24h: volume24h,
        volume7d: volume7d,
        priceChange24h: priceChange24h,
        priceChange7d: priceChange7d,
        marketCap: marketCap,
        ownershipConcentration: ownershipConcentration,
        risk: risk,
        priceHistory: priceHistory,
        image: null,
      };
    });

    return NextResponse.json({
      result: collections,
      page: 0,
      page_size: collections.length,
      total: collections.length,
    });
  } catch (error) {
    console.error('Error generating trending NFT collections:', error);
    return NextResponse.json({ 
      error: 'Failed to generate trending NFT collections', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 