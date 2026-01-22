// Project API Service - Integrates with FastAPI backend
// Backend uses success_response() wrapper: { message: string, data: {...} }

import { getAuthToken, removeAuthToken } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

// Backend success_response wrapper structure
interface BackendSuccessResponse<T = unknown> {
  message: string;
  data?: T;
}

// Project creation payload matching backend schema
export interface ProjectCreatePayload {
  project_name: string;
  support_type: string;
  l1_support_name: string;
  l1_support_number: string;
}

// Create project - Backend returns { message, data: { project_id } }
export const createProject = async (payload: ProjectCreatePayload): Promise<ApiResponse<{ project_id: string }>> => {
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
    
    const result: BackendSuccessResponse<{ project_id: string }> = await response.json();
    console.log('Backend createProject response:', result);
    
    // Extract project_id from nested data structure
    if (result.data?.project_id) {
      return { data: { project_id: result.data.project_id } };
    }
    
    // Fallback: check if project_id is at root level (old format)
    if ((result as any).project_id) {
      return { data: { project_id: (result as any).project_id } };
    }
    
    return { error: 'Backend did not return project_id' };
  } catch (error) {
    console.error('createProject error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// Bulk upload calls via CSV file - Backend returns { message, data: { total_calls } }
export const uploadCallsBulk = async (file: File, projectId: string): Promise<ApiResponse<{ total_calls: number }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const formData = new FormData();
    formData.append('file', file);

    // Backend expects project_id in URL path
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/calls/bulk`, {
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
    
    const result: BackendSuccessResponse<{ total_calls: number }> = await response.json();
    console.log('Backend uploadCallsBulk response:', result);
    
    return { data: result.data || { total_calls: 0 } };
  } catch (error) {
    console.error('uploadCallsBulk error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// SLA payload matching backend schema
export interface SlaPayload {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  response_time_minutes: number;
}

// Attach SLA to project - Backend returns { message }
export const attachSlaToProject = async (projectId: string, slaPayload: SlaPayload): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/sla`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(slaPayload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        removeAuthToken();
        return { error: 'Session expired. Please login again.' };
      }
      return { error: error.detail || 'Failed to attach SLA' };
    }
    
    const result: BackendSuccessResponse = await response.json();
    console.log('Backend attachSlaToProject response:', result);
    
    return { data: { message: result.message } };
  } catch (error) {
    console.error('attachSlaToProject error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// Activate project - Backend returns { message }
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
    
    const result: BackendSuccessResponse = await response.json();
    console.log('Backend activateProject response:', result);
    
    return { data: { message: result.message } };
  } catch (error) {
    console.error('activateProject error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// Get project cost summary - Backend returns { message, data: { total_cost } }
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
    
    const result: BackendSuccessResponse<{ total_cost: number }> = await response.json();
    console.log('Backend getProjectCostSummary response:', result);
    
    return { data: result.data || { total_cost: 0 } };
  } catch (error) {
    console.error('getProjectCostSummary error:', error);
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

// Backend returns raw object (not wrapped in success_response)
export interface AddressValidationResponse {
  summary: {
    service_available: number;
    service_not_available: number;
  };
  non_serviceable_locations: NonServiceableLocation[];
  // Backend uses "Service available locations" key (with space)
  'Service available locations': ServiceableLocation[];
}

// Validate project addresses - Backend returns raw AddressValidationResponse (not wrapped)
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
    
    // Address validation returns raw response (not wrapped in success_response)
    const data: AddressValidationResponse = await response.json();
    console.log('Backend validateProjectAddresses response:', data);
    
    return { data };
  } catch (error) {
    console.error('validateProjectAddresses error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// ========================================
// VENDOR PROJECT LIST & DETAILS API
// ========================================

// Backend project response shape
export interface BackendProject {
  _id?: string;
  project_id?: string;
  project_name: string;
  support_type: string;
  l1_support_name?: string;
  l1_support_number?: string;
  status: string;
  sla?: {
    priority: string;
    response_time_minutes: number;
  } | null;
  created_at: string;
  activated_at?: string | null;
  vendor_id?: string;
  // Summary fields (may come from list endpoint)
  active_calls?: number;
  total_calls?: number;
  total_cost?: number;
}

// Project details response shape (from GET /projects/{id}/details)
export interface ProjectDetailsResponse {
  project: {
    project_id: string;
    project_name: string;
    support_type: string;
    l1_support_name: string;
    l1_support_number: string;
    status: string;
    sla?: {
      priority: string;
      response_time_minutes: number;
    } | null;
    created_at: string;
    activated_at?: string | null;
  };
  summary: {
    active_calls: number;
    total_calls: number;
    total_cost: number;
  };
  calls: ProjectCallRow[];
}

// Call row shape from backend
export interface ProjectCallRow {
  call_id: string;
  branch_name: string;
  branch_code: string;
  address: string;
  pincode: string;
  asset_type: string;
  support_type: string;
  asset_count: number;
  sla_priority?: string;
  status: string;
  engineer_name?: string;
  engineer_contact?: string;
  distance_km?: number;
  serviceable: boolean;
  created_at: string;
  assigned_at?: string;
}

// Fetch all projects for vendor - GET /projects
export const fetchVendorProjects = async (): Promise<ApiResponse<BackendProject[]>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects`, {
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
      return { error: error.detail || 'Failed to fetch projects' };
    }

    const data = await response.json();
    console.log('Backend fetchVendorProjects response:', data);

    // Handle both array and wrapped responses
    if (Array.isArray(data)) {
      return { data };
    }
    if (data.data && Array.isArray(data.data)) {
      return { data: data.data };
    }

    return { data: [] };
  } catch (error) {
    console.error('fetchVendorProjects error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// Fetch project details - GET /projects/{project_id}/details
export const fetchProjectDetails = async (projectId: string): Promise<ApiResponse<ProjectDetailsResponse>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/details`, {
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
      return { error: error.detail || 'Failed to fetch project details' };
    }

    const data: ProjectDetailsResponse = await response.json();
    console.log('Backend fetchProjectDetails response:', data);

    return { data };
  } catch (error) {
    console.error('fetchProjectDetails error:', error);
    return { error: 'Network error. Please try again.' };
  }
};
