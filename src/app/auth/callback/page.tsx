'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WhoopDashboard from '@/components/whoop-dashboard';

function AuthCallbackContent() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setError(`Authorization failed: ${error}`);
      setLoading(false);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      setLoading(false);
      return;
    }

    fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
      .then(async (response) => {
        const text = await response.text();
        let data;
        
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Failed to parse response:', text);
          throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status}`);
        }
        
        setAccessToken(data.access_token);
        localStorage.setItem('whoop_access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('whoop_refresh_token', data.refresh_token);
        }
      })
      .catch((err) => {
        console.error('Token exchange error:', err);
        setError(`Token exchange failed: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Processing authorization...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No access token available</div>
      </div>
    );
  }

  return <WhoopDashboard accessToken={accessToken} />;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading authorization...</div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}