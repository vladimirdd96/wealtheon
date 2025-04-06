import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<Response> {
  return NextResponse.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
} 