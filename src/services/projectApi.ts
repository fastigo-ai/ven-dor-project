// Project API Service - Integrates with FastAPI backend
// Backend uses success_response() wrapper: { message: string, data: {...} }

import { getAuthToken, removeAuthToken } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://door2fyvendor-gv4g4.ondigitalocean.app';
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  l1_support_phone: string;
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
  resolution_time_minutes: number;
  breach_penalty: number;
  escalation_time_minutes: number;
  description: string;
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
  state_name?: string;
  branch_name?: string;
  branch_code?: string;
  address?: string;
  contact_name?: string;
  contact_phone?: string;
  assets_count?: number;
  sla_priority?: string;
}

export interface NonServiceableLocation {
  call_id: string;
  pincode: string;
  asset_type: string;
  support_type: string;
  reason: string;
  state_name?: string;
  branch_name?: string;
  branch_code?: string;
  address?: string;
  contact_name?: string;
  contact_phone?: string;
  assets_count?: number;
  sla_priority?: string;
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
  address: string | null;
  pincode: string;
  asset_type: string;
  support_type: string;
  asset_count: number;
  sla_priority?: string;
  status: string;
  engineer_name?: string | null;
  engineer_contact?: string | null;
  distance_km?: number | null;
  serviceable: boolean;
  created_at: string;
  assigned_at?: string | null;
}

// Paginated response from backend
export interface PaginatedProjectsResponse {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  data: BackendProject[];
}

// Fetch paginated projects for vendor - GET /projects?page=1&page_size=12
export const fetchVendorProjects = async (
  page: number = 1, 
  pageSize: number = 14
): Promise<ApiResponse<PaginatedProjectsResponse>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects?page=${page}&page_size=${pageSize}`, {
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

    // Return paginated response
    return { 
      data: {
        page: data.page || 1,
        page_size: data.page_size || pageSize,
        total: data.total || 0,
        total_pages: data.total_pages || 1,
        data: data.data || []
      }
    };
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

// ========================================
// CALL & PROJECT STATUS MANAGEMENT API
// ========================================

// Hold a single call - POST /{project_id}/calls/{call_id}/hold
export const holdCall = async (projectId: string, callId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/calls/${callId}/hold`, {
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
      return { error: error.detail || 'Failed to hold call' };
    }

    const result: BackendSuccessResponse = await response.json();
    console.log('Backend holdCall response:', result);

    return { data: { message: result.message } };
  } catch (error) {
    console.error('holdCall error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// Resume a single call - POST /{project_id}/calls/{call_id}/resume
export const resumeCall = async (projectId: string, callId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/calls/${callId}/resume`, {
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
      return { error: error.detail || 'Failed to resume call' };
    }

    const result: BackendSuccessResponse = await response.json();
    console.log('Backend resumeCall response:', result);

    return { data: { message: result.message } };
  } catch (error) {
    console.error('resumeCall error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// Pause entire project - POST /{project_id}/pause
export const pauseProject = async (projectId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pause`, {
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
      return { error: error.detail || 'Failed to pause project' };
    }

    const result: BackendSuccessResponse = await response.json();
    console.log('Backend pauseProject response:', result);

    return { data: { message: result.message } };
  } catch (error) {
    console.error('pauseProject error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// Resume entire project - POST /{project_id}/resume
export const resumeProject = async (projectId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/resume`, {
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
      return { error: error.detail || 'Failed to resume project' };
    }

    const result: BackendSuccessResponse = await response.json();
    console.log('Backend resumeProject response:', result);

    return { data: { message: result.message } };
  } catch (error) {
    console.error('resumeProject error:', error);
    return { error: 'Network error. Please try again.' };
  }
};
