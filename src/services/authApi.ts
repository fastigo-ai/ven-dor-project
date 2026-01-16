// Auth API Service - Integrates with FastAPI backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

// Register email - sends OTP
export const registerEmail = async (email: string): Promise<ApiResponse<{ message: string; otp?: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to send OTP' };
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
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Invalid OTP' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Set password after OTP verification
export const setPassword = async (email: string, password: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to set password' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Login
export const loginUser = async (email: string, password: string): Promise<ApiResponse<{ access_token: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      if (response.status === 403) {
        return { error: 'PENDING_APPROVAL' };
      }
      return { error: error.detail || 'Invalid credentials' };
    }
    
    const data = await response.json();
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
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to send reset email' };
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
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to reset password' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
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

// Remove auth token
export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};
