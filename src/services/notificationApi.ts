import { apiFetch } from './apiClient';

export interface Notification {
  _id: string;
  vendor_id: string;
  title: string;
  message: string;
  type: string;
  entity_type: string;
  entity_id: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export const fetchNotifications = async (): Promise<{ data?: Notification[]; error?: string }> => {
  try {
    const response = await apiFetch('/vendor/notifications');
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch notifications' };
    }
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error fetching notifications' };
  }
};

export const fetchUnreadCount = async (): Promise<{ data?: { unread_count: number }; error?: string }> => {
  try {
    const response = await apiFetch('/vendor/notifications/unread-count');
    if (!response.ok) {
      const error = await response.json();
      return { error: error.detail || 'Failed to fetch unread count' };
    }
    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: 'Network error fetching unread count' };
  }
};

export const markNotificationRead = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/vendor/notifications/${id}/read`, {
      method: 'POST'
    });
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.detail || 'Failed to mark as read' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Network error marking notification as read' };
  }
};
