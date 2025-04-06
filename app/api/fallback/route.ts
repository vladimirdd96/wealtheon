import { NextRequest } from 'next/server';

export async function GET(request: NextRequest): Promise<Response> {
  return new Response(
    JSON.stringify({
      message: 'This is a fallback API endpoint',
      timestamp: new Date().toISOString(),
      requestPath: request.nextUrl.pathname
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  return new Response(
    JSON.stringify({
      message: 'POST requests are handled by this fallback API endpoint',
      timestamp: new Date().toISOString(),
      requestPath: request.nextUrl.pathname
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
} 