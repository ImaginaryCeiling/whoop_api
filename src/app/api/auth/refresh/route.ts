import { NextRequest, NextResponse } from 'next/server';

const WHOOP_API_BASE_URL = 'https://api.prod.whoop.com';

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json();
    
    if (!refresh_token) {
      return NextResponse.json({ error: 'No refresh token provided' }, { status: 400 });
    }

    const clientId = process.env.WHOOP_CLIENT_ID;
    const clientSecret = process.env.WHOOP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing Whoop API configuration' }, { status: 500 });
    }

    const response = await fetch(`${WHOOP_API_BASE_URL}/oauth/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whoop token refresh error:', response.status, response.statusText, errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'refresh_token_expired', message: 'Refresh token is invalid or expired' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `Token refresh failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const tokenData = await response.json();
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Token refresh failed' },
      { status: 500 }
    );
  }
}