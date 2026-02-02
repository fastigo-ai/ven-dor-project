// Admin API Service - Integrates with FastAPI backend
// All routes are under /admin/* prefix
// Requires admin role authentication
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://door2fyvendor-gv4g4.ondigitalocean.app';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ADMIN_TOKEN_KEY = 'admin_token';

// Admin token management
export const getAdminToken = (): string | null => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const setAdminToken = (token: string): void => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const clearAdminToken = (): void => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const isAdminAuthenticated = (): boolean => {
  return !!getAdminToken();
};

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

interface AdminLoginResponse {
  message: string;
  access_token: string;
  token_type: string;
}

// Admin Login
export const adminLogin = async (
  email: string,
  password: string
): Promise<ApiResponse<AdminLoginResponse>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.detail || 'Invalid credentials' };
    }

    return { data };
  } catch (error) {
    console.error('Admin login error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// ==============================
// RATE CARDS MANAGEMENT
// ==============================

export interface SlaMultipliers {
  [key: string]: number;
}

export interface RateCard {
  _id?: string;
  support_type: string;
  base_price: number;
  per_asset_price: number;
  sla_hours: number;
  sla_multipliers: SlaMultipliers;
  created_at?: string;
}

export interface RateCardCreate {
  support_type: string;
  base_price: number;
  per_asset_price: number;
  sla_hours: number;
  sla_multipliers: SlaMultipliers;
}

export interface RateCardUpdate {
  base_price: number;
  per_asset_price: number;
  sla_hours: number;
  sla_multipliers: SlaMultipliers;
}

// GET /admin/rate-cards - List all rate cards
export const listRateCards = async (): Promise<ApiResponse<RateCard[]>> => {
  try {
    const token = getAdminToken();
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
        clearAdminToken();
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
    const token = getAdminToken();
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
        clearAdminToken();
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
    const token = getAdminToken();
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
        clearAdminToken();
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
  phone_number: string;
  gst_number: string;
  business_address: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
  created_at?: string;
  rejection_reason?: string;
}

// GET /admin/vendors - List vendors with optional status filter
export const listVendors = async (status?: string): Promise<ApiResponse<Vendor[]>> => {
  try {
    const token = getAdminToken();
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
        clearAdminToken();
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
    const token = getAdminToken();
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
        clearAdminToken();
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
    const token = getAdminToken();
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
        clearAdminToken();
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
    const token = getAdminToken();
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
        clearAdminToken();
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

// ==============================
// PROJECTS MANAGEMENT (Admin View)
// ==============================

export interface AdminProject {
  project_id: string;
  project_name: string;
  support_type: string;
  status: string;
  created_at?: string;
}

// GET /admin/vendors/{vendor_id}/projects - List projects for a vendor
export const listProjectsByVendor = async (vendorId: string): Promise<ApiResponse<AdminProject[]>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/vendors/${encodeURIComponent(vendorId)}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        clearAdminToken();
        return { error: 'Session expired. Please login again.' };
      }
      if (response.status === 403) {
        return { error: 'Admin access required.' };
      }
      return { error: error.detail || 'Failed to fetch projects' };
    }

    const data: AdminProject[] = await response.json();
    console.log('Backend listProjectsByVendor response:', data);

    return { data };
  } catch (error) {
    console.error('listProjectsByVendor error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// ==============================
// CALLS MANAGEMENT (Admin View)
// ==============================

export interface AdminCall {
  call_id: string;
  branch_name?: string;
  pincode?: string;
  asset_type?: string;
  assets_count?: number;
  status?: string;
  serviceable?: boolean;
  created_at?: string;
}

export interface ProjectDetailsResponse {
  project: {
    project_id: string;
    project_name: string;
    status: string;
    support_type: string;
    sla?: any;
    created_at?: string;
  };
  calls: AdminCall[];
}

// GET /admin/projects/{project_id}/details - Get project details with calls
export const getProjectDetails = async (projectId: string): Promise<ApiResponse<ProjectDetailsResponse>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/projects/${encodeURIComponent(projectId)}/details`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        clearAdminToken();
        return { error: 'Session expired. Please login again.' };
      }
      if (response.status === 403) {
        return { error: 'Admin access required.' };
      }
      return { error: error.detail || 'Failed to fetch project details' };
    }

    const data: ProjectDetailsResponse = await response.json();
    console.log('Backend getProjectDetails response:', data);

    return { data };
  } catch (error) {
    console.error('getProjectDetails error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// ==============================
// PROJECT & CALL WORKFLOW ACTIONS (Admin)
// ==============================

// POST /admin/projects/{project_id}/pause - Pause project
export const pauseProject = async (projectId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/projects/${encodeURIComponent(projectId)}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        clearAdminToken();
        return { error: 'Session expired. Please login again.' };
      }
      return { error: error.detail || 'Failed to pause project' };
    }

    const result = await response.json();
    return { data: { message: result.message || 'Project paused successfully' } };
  } catch (error) {
    console.error('pauseProject error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// POST /admin/projects/{project_id}/resume - Resume project
export const resumeProject = async (projectId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/projects/${encodeURIComponent(projectId)}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        clearAdminToken();
        return { error: 'Session expired. Please login again.' };
      }
      return { error: error.detail || 'Failed to resume project' };
    }

    const result = await response.json();
    return { data: { message: result.message || 'Project resumed successfully' } };
  } catch (error) {
    console.error('resumeProject error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// POST /admin/calls/{call_id}/hold - Hold call with reason
export const holdCall = async (callId: string, reason: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/calls/${encodeURIComponent(callId)}/hold`, {
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
        clearAdminToken();
        return { error: 'Session expired. Please login again.' };
      }
      return { error: error.detail || 'Failed to hold call' };
    }

    const result = await response.json();
    return { data: { message: result.message || 'Call held successfully' } };
  } catch (error) {
    console.error('holdCall error:', error);
    return { error: 'Network error. Please try again.' };
  }
};

// POST /admin/calls/{call_id}/resume - Resume call
export const resumeCall = async (callId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const token = getAdminToken();
    if (!token) {
      return { error: 'Authentication required. Please login again.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin/calls/${encodeURIComponent(callId)}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        clearAdminToken();
        return { error: 'Session expired. Please login again.' };
      }
      return { error: error.detail || 'Failed to resume call' };
    }

    const result = await response.json();
    return { data: { message: result.message || 'Call resumed successfully' } };
  } catch (error) {
    console.error('resumeCall error:', error);
    return { error: 'Network error. Please try again.' };
  }
};
