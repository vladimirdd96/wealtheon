import { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { addresses } = await request.json();
    
    if (!addresses || !Array.isArray(addresses)) {
      return new Response(
        JSON.stringify({ error: 'Addresses parameter is required and must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const moralisApiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
    
    if (!moralisApiKey) {
      throw new Error('Moralis API key is not configured');
    }
    
    // Make the request to Moralis API
    const response = await fetch('https://solana-gateway.moralis.io/token/mainnet/prices', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': moralisApiKey
      },
      body: JSON.stringify({ addresses })
    });
    
    // If the Moralis API response was not successful
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Moralis API error:', errorData);
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch token prices from Moralis' }),
        { 
          status: response.status, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return the response from Moralis
    const data = await response.json();
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in token prices API route:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 