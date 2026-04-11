// Auth API Service - Integrates with FastAPI backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://door2fyvendor-gv4g4.ondigitalocean.app';
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

/**
 * Extracts a human-readable error message from API error response details.
 * Handles strings, arrays of objects (FastAPI validation errors), and simple objects.
 */
const extractErrorMessage = (detail: any): string => {
  if (!detail) return 'An unexpected error occurred';
  if (typeof detail === 'string') return detail;
  
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && first !== null && first.msg) {
      // capitalizes the first letter if needed
      return first.msg.charAt(0).toUpperCase() + first.msg.slice(1);
    }
    return JSON.stringify(first);
  }
  
  if (typeof detail === 'object' && detail !== null) {
    if (detail.msg) return detail.msg;
    if (detail.message) return detail.message;
    return JSON.stringify(detail);
  }
  
  return String(detail);
};

// Register email - sends OTP
export const registerEmail = async (email: string): Promise<ApiResponse<{ message: string; otp?: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: extractErrorMessage(error.detail) || 'Failed to send OTP' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Verify OTP
export const verifyOtp = async (email: string, otp: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: extractErrorMessage(error.detail) || 'Invalid OTP' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Set password after OTP verification
export const setPassword = async (email: string, password: string): Promise<ApiResponse<{ message: string; access_token?: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: extractErrorMessage(error.detail) || 'Failed to set password' };
    }
    
    const data = await response.json();
    
    // Store the tokens if returned by backend
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    if (data.refresh_token) {
      setRefreshToken(data.refresh_token);
    }
    
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Login
export const loginUser = async (email: string, password: string): Promise<ApiResponse<{ access_token: string, refresh_token: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      if (response.status === 403) {
        return { error: 'PENDING_APPROVAL' };
      }
      return { error: extractErrorMessage(error.detail) || 'Invalid credentials' };
    }
    
    const data = await response.json();
    
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    if (data.refresh_token) {
      setRefreshToken(data.refresh_token);
    }
    
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Forgot password - sends OTP
export const forgotPassword = async (email: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: extractErrorMessage(error.detail) || 'Failed to send reset email' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Reset password with OTP
export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}&new_password=${encodeURIComponent(newPassword)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: extractErrorMessage(error.detail) || 'Failed to reset password' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Refresh Session
export const refreshSession = async (): Promise<ApiResponse<{ access_token: string }>> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return { error: 'No refresh token available' };
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!response.ok) {
      removeAuthToken();
      removeRefreshToken();
      return { error: 'Session expired. Please login again.' };
    }
    
    const data = await response.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return { data };
  } catch (error) {
    return { error: 'Network error during session refresh' };
  }
};

// Logout
export const logoutUser = async (): Promise<void> => {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout?refresh_token=${encodeURIComponent(refreshToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeAuthToken();
    removeRefreshToken();
  }
};

// Store auth token
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

// Get auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Store refresh token
export const setRefreshToken = (token: string) => {
  localStorage.setItem('refresh_token', token);
};

// Get refresh token
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

// Remove tokens
export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

export const removeRefreshToken = () => {
  localStorage.removeItem('refresh_token');
};

import { apiFetch } from './apiClient';

// Vendor Profile API
interface VendorProfilePayload {
  company_name: string;
  gst_number: string;
  registration_number: string;
  business_address: string;
  contact_person_name: string;
  phone_number: string;
  website_url?: string;
}

export const createVendorProfile = async (payload: VendorProfilePayload): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiFetch('/vendor/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: extractErrorMessage(error.detail) || 'Failed to submit company details' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Get vendor profile (requires auth token)
export interface VendorProfile {
  _id: string;
  email: string;
  company_name?: string;
  gst_number?: string;
  registration_number?: string;
  business_address?: string;
  contact_person_name?: string;
  phone_number?: string;
  website_url?: string;
  status: string;
  profile_status?: string;
}

export const getVendorProfile = async (): Promise<ApiResponse<VendorProfile>> => {
  try {
    const response = await apiFetch('/vendor/profile', {
      method: 'GET',
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: extractErrorMessage(error.detail) || 'Failed to fetch profile' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};
