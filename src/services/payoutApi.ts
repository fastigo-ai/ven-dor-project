import { apiFetch } from './apiClient';

export interface PayoutSummary {
  mature_balance: number;
  upcoming_balance: number;
  paid_total: number;
}

export interface PayoutRecord {
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
}

export const fetchPayoutSummary = async (): Promise<{ data?: PayoutSummary; error?: string }> => {
  try {
    const response = await apiFetch('/vendor/payouts/summary');
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch payout summary' };
    }
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error fetching payout summary' };
  }
};

export const fetchPayoutHistory = async (limit: number = 50, skip: number = 0): Promise<{ data?: PayoutRecord[]; error?: string }> => {
  try {
    const response = await apiFetch(`/vendor/payouts/history?limit=${limit}&skip=${skip}`);
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch payout history' };
    }
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error fetching payout history' };
  }
};

export interface ProjectPayoutSummary {
  matured_amount: number;
  upcoming_amount: number;
  paid_amount: number;
  total_earned: number;
}

export const fetchProjectPayoutSummary = async (projectId: string): Promise<{ data?: ProjectPayoutSummary; error?: string }> => {
  try {
    const response = await apiFetch(`/vendor/payouts/project/${projectId}/summary`);
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch project payout summary' };
    }
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error fetching project payout summary' };
  }
};
