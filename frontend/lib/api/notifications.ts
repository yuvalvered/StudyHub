/**
 * Notifications API
 * Handles user notifications and notification settings
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

async function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

export enum NotificationType {
  COMMENT_ON_MATERIAL = 'comment_on_material',
  COMMENT_ON_DISCUSSION = 'comment_on_discussion',
  REPLY_TO_COMMENT = 'reply_to_comment',
  MATERIAL_RATED = 'material_rated'
}

export interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  email_sent: boolean
  related_comment_id: number | null
  related_material_id: number | null
  related_discussion_id: number | null
  actor_id: number | null
  created_at: string
}

export interface NotificationListResponse {
  total: number
  unread_count: number
  notifications: Notification[]
}

export interface NotificationSettings {
  id: number
  user_id: number
  comment_on_material_in_app: boolean
  comment_on_material_email: boolean
  comment_on_discussion_in_app: boolean
  comment_on_discussion_email: boolean
  reply_to_comment_in_app: boolean
  reply_to_comment_email: boolean
  material_rated_in_app: boolean
  material_rated_email: boolean
}

export interface NotificationSettingsUpdate {
  comment_on_material_in_app?: boolean
  comment_on_material_email?: boolean
  comment_on_discussion_in_app?: boolean
  comment_on_discussion_email?: boolean
  reply_to_comment_in_app?: boolean
  reply_to_comment_email?: boolean
  material_rated_in_app?: boolean
  material_rated_email?: boolean
}

export const notificationsAPI = {
  /**
   * Get notifications for current user
   */
  getNotifications: async (unreadOnly = false, skip = 0, limit = 50): Promise<NotificationListResponse> => {
    const params = new URLSearchParams({
      unread_only: unreadOnly.toString(),
      skip: skip.toString(),
      limit: limit.toString()
    })

    const response = await fetch(`${API_URL}/notifications?${params}`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch notifications')
    }

    return response.json()
  },

  /**
   * Get only unread notifications
   */
  getUnreadNotifications: async (skip = 0, limit = 50): Promise<NotificationListResponse> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    })

    const response = await fetch(`${API_URL}/notifications/unread?${params}`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch unread notifications')
    }

    return response.json()
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: number): Promise<Notification> => {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: await getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to mark notification as read')
    }

    return response.json()
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: await getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read')
    }

    return response.json()
  },

  /**
   * Get notification settings for current user
   */
  getSettings: async (): Promise<NotificationSettings> => {
    const response = await fetch(`${API_URL}/notifications/settings`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch notification settings')
    }

    return response.json()
  },

  /**
   * Update notification settings
   */
  updateSettings: async (settings: NotificationSettingsUpdate): Promise<NotificationSettings> => {
    const response = await fetch(`${API_URL}/notifications/settings`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(settings)
    })

    if (!response.ok) {
      throw new Error('Failed to update notification settings')
    }

    return response.json()
  }
}
