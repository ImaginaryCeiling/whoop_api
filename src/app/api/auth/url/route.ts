import { NextResponse } from 'next/server';

const WHOOP_API_BASE_URL = 'https://api.prod.whoop.com';

export async function GET() {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const redirectUri = process.env.WHOOP_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Missing Whoop API configuration' }, { status: 500 });
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement',
    state: Math.random().toString(36).substring(2, 15),
  });

  const authUrl = `${WHOOP_API_BASE_URL}/oauth/oauth2/auth?${params.toString()}`;

  return NextResponse.json({ authUrl });
}