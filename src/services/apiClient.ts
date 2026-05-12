import { refreshSession, removeAuthToken, removeRefreshToken } from './authApi';

const envUrl = import.meta.env.VITE_API_URL || 'https://door2fyvendor-gv4g4.ondigitalocean.app';
const API_BASE_URL = typeof window !== 'undefined' && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))
  ? `http://${window.location.hostname}:8000`
  : envUrl;

interface FetchOptions extends RequestInit {
  authenticated?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void, reject: (reason?: any) => void }> = [];

export const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const { authenticated = true, ...rest } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(rest.headers);
  if (rest.body && !headers.has('Content-Type') && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
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
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => fetch(url, { ...config, credentials: 'include' })) as Promise<Response>;
      }

      isRefreshing = true;
      console.log('Access token expired, attempting refresh...');
      const refreshResult = await refreshSession();

      if (!refreshResult.error) {
        // Process queue
        failedQueue.forEach(prom => prom.resolve());
        failedQueue = [];
        isRefreshing = false;

        // Retry the original request (cookies will be automatically included)
        response = await fetch(url, {
          ...config,
          credentials: 'include'
        });
      } else {
        // Refresh failed, clear session and force login
        failedQueue.forEach(prom => prom.reject(new Error('Session expired')));
        failedQueue = [];
        isRefreshing = false;
        
        console.error('Refresh token invalid or expired');
        removeAuthToken();
        removeRefreshToken();
        
        // Force redirect to login on fatal auth failure
        if (typeof window !== 'undefined') {
          const isLoginPage = window.location.pathname.startsWith('/login');
          const isAdminPage = window.location.pathname.startsWith('/admin');
          
          if (!isLoginPage && !isAdminPage) {
            window.location.href = '/login?expired=true';
          }
        }
      }
    }

    return response;
  } catch (error) {
    console.error('apiFetch error:', error);
    throw error;
  }
};
