import { NextRequest } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis with API key
if (!Moralis.Core.isStarted) {
  Moralis.start({
    apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
  });
}

interface PageParams {
  moralis: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: PageParams }
) {
  try {
    const { searchParams } = new URL(request.url);
    const path = params.moralis.join('/');
    
    // Pass the path and query params to the correct Moralis endpoint
    // This is a simplified implementation - you may need to adapt based on your needs
    const response = await fetch(`https://deep-index.moralis.io/api/v2/${path}?${searchParams.toString()}`, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY || '',
        'Accept': 'application/json',
      },
    });
    
    return response;
  } catch (error) {
    console.error('Moralis API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: PageParams }
) {
  try {
    const path = params.moralis.join('/');
    const body = await request.json();
    
    // Pass the path and body to the correct Moralis endpoint
    const response = await fetch(`https://deep-index.moralis.io/api/v2/${path}`, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    return response;
  } catch (error) {
    console.error('Moralis API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}