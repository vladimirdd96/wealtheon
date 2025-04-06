import { NextRequest } from 'next/server';
import Moralis from 'moralis';

// Initialize Moralis
if (!Moralis.Core.isStarted) {
  Moralis.start({
    apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moralis: string[] }> }
): Promise<Response> {
  try {
    // Get path parameters and query string
    const awaitedParams = await params;
    const path = awaitedParams.moralis.join('/');
    const { searchParams } = new URL(request.url);

    // Make a request to Moralis API
    const response = await fetch(`https://deep-index.moralis.io/api/v2/${path}?${searchParams.toString()}`, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY || '',
      }
    });

    // Return the API response directly to avoid any transformation issues
    // This helps with compatibility across Next.js versions
    return response;
  } catch (error) {
    console.error('Error in Moralis API route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch data from Moralis' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moralis: string[] }> }
): Promise<Response> {
  try {
    // Get the request body
    const body = await request.json();
    
    // Get path
    const awaitedParams = await params;
    const path = awaitedParams.moralis.join('/');

    // Make a request to Moralis API
    const response = await fetch(`https://deep-index.moralis.io/api/v2/${path}`, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Return the API response directly
    return response;
  } catch (error) {
    console.error('Error in Moralis API route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send data to Moralis' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}