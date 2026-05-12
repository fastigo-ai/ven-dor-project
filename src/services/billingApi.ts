import { apiFetch } from './apiClient';

export interface BillingSummary {
  unbilled_balance: number;
  billable_balance: number;
  paid_total: number;
  project_count: number;
  active_project_count: number;
  call_count: number;
  maturation_days: number;
}

export interface BillingRecord {
  _id: string;
  call_id: string;
  project_id: string;
  vendor_id: string;
  amount: number;
  status: string;
  display_status: string;
  eligible_at: string;
  created_at: string;
  paid_at?: string;
  last_failure_reason?: string;
}

export const fetchBillingSummary = async (): Promise<{ data?: BillingSummary; error?: string }> => {
  try {
    const response = await apiFetch('/vendor/billing/summary');
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch billing summary' };
    }
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error fetching billing summary' };
  }
};

export const fetchBillingHistory = async (limit: number = 50, skip: number = 0): Promise<{ data?: BillingRecord[]; error?: string }> => {
  try {
    const response = await apiFetch(`/vendor/billing/history?limit=${limit}&skip=${skip}`);
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch billing history' };
    }
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error fetching billing history' };
  }
};

// GET /vendor/billing/transactions - Audit trail of payment attempts
export const fetchBillingTransactions = async (limit: number = 20): Promise<{ data?: any[]; error?: string }> => {
  try {
    const response = await apiFetch(`/vendor/billing/transactions?limit=${limit}`);

    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch transaction history' };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('fetchBillingTransactions error:', error);
    return { error: 'Network error' };
  }
};

export interface ProjectBillingSummary {
  billable_amount: number;
  unbilled_amount: number;
  paid_amount: number;
  total_amount: number;
}

export const fetchProjectBillingSummary = async (projectId: string): Promise<{ data?: ProjectBillingSummary; error?: string }> => {
  try {
    const response = await apiFetch(`/vendor/billing/project/${projectId}/summary`);
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch project billing summary' };
    }
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error fetching project billing summary' };
  }
};

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export const initiatePayment = async (payoutIds: string[]): Promise<{ data?: { order: RazorpayOrder; key_id: string }; error?: string }> => {
  try {
    const response = await apiFetch('/vendor/billing/pay', {
      method: 'POST',
      body: JSON.stringify({ payout_ids: payoutIds }),
    });
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to initiate payment' };
    }
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error initiating payment' };
  }
};

// POST /vendor/billing/cancel/{transaction_id}
export const cancelTransaction = async (transactionId: string): Promise<{ message?: string; error?: string }> => {
  try {
    const response = await apiFetch(`/vendor/billing/cancel/${transactionId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to cancel payment' };
    }
    const data = await response.json();
    return { message: data.message };
  } catch (err) {
    return { error: 'Network error cancelling payment' };
  }
};

export const syncBillingStatus = async (): Promise<{ message?: string; error?: string }> => {
  try {
    const response = await apiFetch('/vendor/billing/sync', {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to sync billing status' };
    }
    const data = await response.json();
    return { message: data.message };
  } catch (err) {
    return { error: 'Network error during sync' };
  }
};
