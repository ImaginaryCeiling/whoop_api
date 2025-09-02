import {
  WhoopUser,
  WhoopBodyMeasurement,
  WhoopRecovery,
  WhoopSleep,
  WhoopWorkout,
  WhoopCycle,
  WhoopApiResponse
} from '@/types/whoop';

const WHOOP_API_BASE_URL = 'https://api.prod.whoop.com';

export class WhoopApiClient {
  private accessToken: string;
  private onTokenRefresh?: (newToken: string) => void;

  constructor(accessToken: string, onTokenRefresh?: (newToken: string) => void) {
    this.accessToken = accessToken;
    this.onTokenRefresh = onTokenRefresh;
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('whoop_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      throw new Error('Invalid response from refresh endpoint');
    }

    if (!response.ok) {
      if (data.error === 'refresh_token_expired') {
        localStorage.removeItem('whoop_access_token');
        localStorage.removeItem('whoop_refresh_token');
        throw new Error('REFRESH_TOKEN_EXPIRED');
      }
      throw new Error(data.error || `Refresh failed: ${response.status}`);
    }

    const newAccessToken = data.access_token;
    localStorage.setItem('whoop_access_token', newAccessToken);
    if (data.refresh_token) {
      localStorage.setItem('whoop_refresh_token', data.refresh_token);
    }

    this.accessToken = newAccessToken;
    this.onTokenRefresh?.(newAccessToken);
    
    return newAccessToken;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const makeApiCall = async (token: string): Promise<Response> => {
      return fetch(`${WHOOP_API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    };

    let response = await makeApiCall(this.accessToken);

    if (response.status === 401) {
      try {
        const newToken = await this.refreshToken();
        response = await makeApiCall(newToken);
      } catch (refreshError) {
        if (refreshError instanceof Error && refreshError.message === 'REFRESH_TOKEN_EXPIRED') {
          throw new Error('AUTHENTICATION_EXPIRED');
        }
        throw refreshError;
      }
    }

    if (!response.ok) {
      throw new Error(`Whoop API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getUser(): Promise<WhoopUser> {
    return this.makeRequest<WhoopUser>('/developer/v1/user/profile/basic');
  }

  async getBodyMeasurements(): Promise<WhoopBodyMeasurement> {
    return this.makeRequest<WhoopBodyMeasurement>('/developer/v1/user/measurement/body');
  }

  async getRecoveries(limit: number = 25): Promise<WhoopApiResponse<WhoopRecovery>> {
    return this.makeRequest<WhoopApiResponse<WhoopRecovery>>(`/developer/v1/recovery?limit=${limit}`);
  }

  async getSleeps(limit: number = 25): Promise<WhoopApiResponse<WhoopSleep>> {
    return this.makeRequest<WhoopApiResponse<WhoopSleep>>(`/developer/v1/activity/sleep?limit=${limit}`);
  }

  async getWorkouts(limit: number = 25): Promise<WhoopApiResponse<WhoopWorkout>> {
    return this.makeRequest<WhoopApiResponse<WhoopWorkout>>(`/developer/v1/activity/workout?limit=${limit}`);
  }

  async getCycles(limit: number = 25): Promise<WhoopApiResponse<WhoopCycle>> {
    return this.makeRequest<WhoopApiResponse<WhoopCycle>>(`/developer/v1/cycle?limit=${limit}`);
  }
}

export function getAuthUrl(): string {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const redirectUri = process.env.WHOOP_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('Missing Whoop API configuration');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement',
    state: Math.random().toString(36).substring(2, 15),
  });

  return `${WHOOP_API_BASE_URL}/oauth/oauth2/auth?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; refresh_token: string }> {
  const response = await fetch(`${WHOOP_API_BASE_URL}/oauth/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      redirect_uri: process.env.WHOOP_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}