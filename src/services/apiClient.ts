import { getAuthToken, refreshSession, removeAuthToken, removeRefreshToken } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://door2fyvendor-gv4g4.ondigitalocean.app';

interface FetchOptions extends RequestInit {
  authenticated?: boolean;
}

export const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const { authenticated = true, ...rest } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(rest.headers);
  if (rest.body && !headers.has('Content-Type') && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (authenticated) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const config = {
    ...rest,
    headers,
  };

  try {
    let response = await fetch(url, {
      ...config,
      credentials: 'include'
    });

    // If 401 and we are authenticated, try refreshing the token
    if (response.status === 401 && authenticated) {
      console.log('Access token expired, attempting refresh...');
      const refreshResult = await refreshSession();
      
      if (refreshResult.data?.access_token) {
        // Retry the original request with the new token
        const retryHeaders = new Headers(headers);
        retryHeaders.set('Authorization', `Bearer ${refreshResult.data.access_token}`);
        
        response = await fetch(url, {
          ...config,
          headers: retryHeaders,
          credentials: 'include'
        });
      } else {
        // Refresh failed, clear session and force login
        console.error('Refresh token invalid or expired');
        removeAuthToken();
        removeRefreshToken();
      }
    }

    return response;
  } catch (error) {
    console.error('apiFetch error:', error);
    throw error;
  }
};
