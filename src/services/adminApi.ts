// Admin API Service - Integrates with FastAPI backend
// All routes are under /admin/* prefix
// Requires admin role authentication

import { getAuthToken, removeAuthToken } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

// ==============================
// RATE CARDS MANAGEMENT
// ==============================

export interface RateCard {
  _id?: string;
  support_type: string;
  base_rate: number;
  per_km_rate: number;
  urgent_multiplier: number;
  created_at?: string;
}

export interface RateCardCreate {
  support_type: string;
  base_rate: number;
  per_km_rate: number;
  urgent_multiplier: number;
}

export interface RateCardUpdate {
  base_rate: number;
  per_km_rate: number;
  urgent_multiplier: number;
}

// GET /admin/rate-cards - List all rate cards
export const listRateCards = async (): Promise<ApiResponse<RateCard[]>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/rate-cards`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        removeAuthToken();
        return { error: 'Session expired. Please login again.' };
      }
      if (response.status === 403) {
        return { error: 'Admin access required.' };
      }
      return { error: error.detail || 'Failed to fetch rate cards' };
    }

    const data: RateCard[] = await response.json();
    console.log('Backend listRateCards response:', data);

    return { data };
  } catch (error) {
    console.error('listRateCards error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// POST /admin/rate-card - Add new rate card
export const addRateCard = async (payload: RateCardCreate): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/rate-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        removeAuthToken();
        return { error: 'Session expired. Please login again.' };
      }
      if (response.status === 403) {
        return { error: 'Admin access required.' };
      }
      return { error: error.detail || 'Failed to add rate card' };
    }

    const result = await response.json();
    console.log('Backend addRateCard response:', result);

    return { data: { message: result.message } };
  } catch (error) {
    console.error('addRateCard error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// PUT /admin/rate-card/{support_type} - Update rate card
export const updateRateCard = async (supportType: string, payload: RateCardUpdate): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/rate-card/${encodeURIComponent(supportType)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        removeAuthToken();
        return { error: 'Session expired. Please login again.' };
      }
      if (response.status === 403) {
        return { error: 'Admin access required.' };
      }
      return { error: error.detail || 'Failed to update rate card' };
    }

    const result = await response.json();
    console.log('Backend updateRateCard response:', result);

    return { data: { message: result.message } };
  } catch (error) {
    console.error('updateRateCard error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// ==============================
// VENDOR MANAGEMENT
// ==============================

export interface Vendor {
  _id: string;
  company_name: string;
  email: string;
  phone: string;
  gst_number: string;
  address: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
  created_at?: string;
  rejection_reason?: string;
}

// GET /admin/vendors - List vendors with optional status filter
export const listVendors = async (status?: string): Promise<ApiResponse<Vendor[]>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const url = status 
      ? `${API_BASE_URL}/admin/vendors?status=${encodeURIComponent(status)}`
      : `${API_BASE_URL}/admin/vendors`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        removeAuthToken();
        return { error: 'Session expired. Please login again.' };
      }
      if (response.status === 403) {
        return { error: 'Admin access required.' };
      }
      return { error: error.detail || 'Failed to fetch vendors' };
    }

    const data: Vendor[] = await response.json();
    console.log('Backend listVendors response:', data);

    return { data };
  } catch (error) {
    console.error('listVendors error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// POST /admin/vendors/{vendor_id}/approve - Approve vendor
export const approveVendor = async (vendorId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        removeAuthToken();
        return { error: 'Session expired. Please login again.' };
      }
      if (response.status === 403) {
        return { error: 'Admin access required.' };
      }
      return { error: error.detail || 'Failed to approve vendor' };
    }

    const result = await response.json();
    console.log('Backend approveVendor response:', result);

    return { data: { message: result.message } };
  } catch (error) {
    console.error('approveVendor error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// POST /admin/vendors/{vendor_id}/reject - Reject vendor (if endpoint exists)
export const rejectVendor = async (vendorId: string, reason?: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        removeAuthToken();
        return { error: 'Session expired. Please login again.' };
      }
      if (response.status === 403) {
        return { error: 'Admin access required.' };
      }
      return { error: error.detail || 'Failed to reject vendor' };
    }

    const result = await response.json();
    console.log('Backend rejectVendor response:', result);

    return { data: { message: result.message } };
  } catch (error) {
    console.error('rejectVendor error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// POST /admin/vendors/{vendor_id}/block - Block vendor (if endpoint exists)
export const blockVendor = async (vendorId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        removeAuthToken();
        return { error: 'Session expired. Please login again.' };
      }
      if (response.status === 403) {
        return { error: 'Admin access required.' };
      }
      return { error: error.detail || 'Failed to block vendor' };
    }

    const result = await response.json();
    console.log('Backend blockVendor response:', result);

    return { data: { message: result.message } };
  } catch (error) {
    console.error('blockVendor error:', error);
    return { error: 'Network error. Please try again.' };
  }
};
