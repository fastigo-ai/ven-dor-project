// Project API Service - Integrates with FastAPI backend

import { getAuthToken, removeAuthToken } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

// Project creation payload matching backend schema
export interface ProjectCreatePayload {
  project_name: string;
  support_type: string;
  l1_support_name: string;
  l1_support_number: string;
}

// Create project
export const createProject = async (payload: ProjectCreatePayload): Promise<ApiResponse<{ message: string; project_id?: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects`, {
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
      return { error: error.detail || 'Failed to create project' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Bulk upload calls via CSV file
export const uploadCallsBulk = async (file: File, projectId?: string): Promise<ApiResponse<{ message: string; total_calls?: number }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
      formData.append('project_id', projectId);
    }

    const response = await fetch(`${API_BASE_URL}/calls/bulk`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        removeAuthToken();
        return { error: 'Session expired. Please login again.' };
      }
      return { error: error.detail || 'Failed to upload calls' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Activate project
export const activateProject = async (projectId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/activate`, {
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
      return { error: error.detail || 'Failed to activate project' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Get project cost summary
export const getProjectCostSummary = async (projectId: string): Promise<ApiResponse<{ total_cost: number }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/cost-summary`, {
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
      return { error: error.detail || 'Failed to get cost summary' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

// Address validation response types
export interface ServiceableLocation {
  call_id: string;
  pincode: string;
  asset_type: string;
  support_type: string;
}

export interface NonServiceableLocation {
  call_id: string;
  pincode: string;
  asset_type: string;
  support_type: string;
  reason: string;
}

export interface AddressValidationResponse {
  summary: {
    service_available: number;
    service_not_available: number;
  };
  non_serviceable_locations: NonServiceableLocation[];
  'Service available locations': ServiceableLocation[];
}

// Validate project addresses
export const validateProjectAddresses = async (projectId: string): Promise<ApiResponse<AddressValidationResponse>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/address-validation`, {
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
      return { error: error.detail || 'Failed to validate addresses' };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};
