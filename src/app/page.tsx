'use client';

import { useEffect, useState } from 'react';
import AuthButton from '@/components/auth-button';
import WhoopDashboard from '@/components/whoop-dashboard';

export default function Home() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('whoop_access_token');
    setAccessToken(token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!accessToken) {
    return <AuthButton />;
  }

  return <WhoopDashboard accessToken={accessToken} />;
}
