import { NextRequest, NextResponse } from 'next/server';

const WHOOP_API_BASE_URL = 'https://api.prod.whoop.com';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const clientId = process.env.WHOOP_CLIENT_ID;
    const clientSecret = process.env.WHOOP_CLIENT_SECRET;
    const redirectUri = process.env.WHOOP_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ error: 'Missing Whoop API configuration' }, { status: 500 });
    }

    const response = await fetch(`${WHOOP_API_BASE_URL}/oauth/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whoop API error:', response.status, response.statusText, errorText);
      return NextResponse.json(
        { error: `Token exchange failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const tokenData = await response.json();
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Token exchange failed' },
      { status: 500 }
    );
  }
}