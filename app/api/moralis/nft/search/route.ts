import { NextRequest, NextResponse } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis with API key if not already started
if (!Moralis.Core.isStarted) {
  Moralis.start({
    apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
  });
}

// Helper function to convert chain string to Moralis chain format
function getChainValue(chainStr: string): string {
  // Moralis requires specific chain formats
  const chainMap: Record<string, string> = {
    'eth': '0x1',
    'ethereum': '0x1',
    'goerli': '0x5',
    'sepolia': '0xaa36a7',
    'polygon': '0x89',
    'mumbai': '0x13881',
    'bsc': '0x38',
    'bsc testnet': '0x61',
    'avalanche': '0xa86a',
    'fantom': '0xfa',
    'cronos': '0x19',
    'arbitrum': '0xa4b1'
  };
  
  return chainMap[chainStr.toLowerCase()] || '0x1'; // Default to Ethereum mainnet
}

// Collection interface based on Moralis API response
interface NFTCollection {
  contract_address: string;
  name: string;
  contract_ticker_symbol?: string;
  volume_24h?: string;
  market_cap?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const chainInput = searchParams.get('chain') || 'eth';
    const chain = getChainValue(chainInput);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || null;
    
    // Check required parameters
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Check for API key
    if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY) {
      return NextResponse.json({ error: 'Moralis API key is not configured' }, { status: 500 });
    }
    
    // For NFT search, we'll use different approaches based on the query
    let responseData;
    
    if (query.startsWith('0x') && query.length === 42) {
      // If query is a contract address, get NFTs from that collection
      const response = await Moralis.EvmApi.nft.getContractNFTs({
        address: query,
        chain, // Use converted chain value
        limit,
        cursor: cursor || undefined,
        normalizeMetadata: true,
      });
      
      responseData = response.toJSON();
    } else {
      // For non-address queries, search by name using a direct API call
      // First, try to find a popular collection matching the query using the search param
      const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/nft/search?query=${encodeURIComponent(query)}&chain=${chain}&limit=${limit}&cursor=${cursor || ''}`,
        {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY || '',
          }
        }
      );
      
      if (!response.ok) {
        // Fallback: search for collections by contract
        try {
          // Get some popular collections that match the query
          const popularCollections = await searchPopularNFTs(query, chain, limit);
          
          if (popularCollections.length > 0) {
            responseData = {
              result: popularCollections,
              cursor: null,
              total: popularCollections.length
            };
          } else {
            // No matching collections found
            responseData = { result: [], cursor: null, total: 0 };
          }
        } catch (err) {
          console.error('Error in fallback search:', err);
          throw new Error(`Failed to search for NFTs: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else {
        responseData = await response.json();
      }
    }
    
    // Process the results to ensure images are included
    if (responseData && responseData.result) {
      responseData.result = responseData.result.map((nft: any) => {
        // Extract image URL from metadata if available
        let imageUrl = null;
        
        if (nft.normalized_metadata && nft.normalized_metadata.image) {
          imageUrl = nft.normalized_metadata.image;
        } else if (nft.metadata) {
          // Try to parse metadata if it's a string
          try {
            if (typeof nft.metadata === 'string') {
              const parsedMetadata = JSON.parse(nft.metadata);
              imageUrl = parsedMetadata.image || parsedMetadata.image_url || null;
            } else if (typeof nft.metadata === 'object') {
              imageUrl = nft.metadata.image || nft.metadata.image_url || null;
            }
          } catch (e) {
            console.error('Error parsing NFT metadata:', e);
          }
        }
        
        // Add image URL to the NFT object
        return {
          ...nft,
          image_url: imageUrl || nft.image || null
        };
      });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error searching NFTs:', error);
    return NextResponse.json({ 
      error: 'Failed to search NFTs', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// Direct fetch of popular NFTs to display when search fails
async function searchPopularNFTs(query: string, chain: string, limit: number): Promise<any[]> {
  // Manually fetch some top NFTs from popular collections
  // This is a fallback when the search API fails
  const collections = [
    { 
      address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', 
      name: 'Bored Ape Yacht Club', 
      image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
      floor_price: 18.88,
      token_id: '1'
    },
    { 
      address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb', 
      name: 'CryptoPunks',
      image: 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?w=500&auto=format',
      floor_price: 49.77,
      token_id: '1'
    },
    { 
      address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6', 
      name: 'Mutant Ape Yacht Club',
      image: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI?w=500&auto=format',
      floor_price: 5.63,
      token_id: '1'
    },
    { 
      address: '0xed5af388653567af2f388e6224dc7c4b3241c544', 
      name: 'Azuki',
      image: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format',
      floor_price: 8.91,
      token_id: '1'
    },
    { 
      address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b', 
      name: 'CloneX',
      image: 'https://i.seadn.io/gae/XN0XuD8Uh3jyRWNtPTFeXJg_ht8m5ofDx6aHklOiy4amhFuWUa0JaR6It49AH8tlnYS386Q0TW_-Lmedn0UET_ko1a3CbJGeu5iHMg?w=500&auto=format',
      floor_price: 3.9,
      token_id: '1'
    }
  ];
  
  // Filter by query if provided
  const filteredResults = query 
    ? collections.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : collections;
  
  // Map to format we need
  return filteredResults.slice(0, limit).map(collection => ({
    token_address: collection.address,
    name: collection.name,
    symbol: collection.name.split(' ').map(word => word[0]).join(''),
    token_id: collection.token_id,
    contract_type: 'ERC721',
    token_uri: null,
    metadata: JSON.stringify({
      name: collection.name,
      image: collection.image,
      description: `${collection.name} is a popular NFT collection`,
      attributes: []
    }),
    normalized_metadata: {
      name: collection.name,
      image: collection.image,
      description: `${collection.name} is a popular NFT collection`,
      attributes: []
    },
    image_url: collection.image,
    floor_price: collection.floor_price,
    // Include other fields we need
    amount: '1',
    block_number_minted: '',
    updated_at: new Date().toISOString(),
    owner_of: '',
    last_token_uri_sync: '',
    last_metadata_sync: '',
  }));
} 