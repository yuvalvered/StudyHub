'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { notificationsAPI, Notification, NotificationType } from '@/lib/api/notifications'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '')

/**
 * NotificationBell Component
 * Displays a notification bell icon with unread count badge
 * Shows dropdown with list of notifications when clicked
 */
export default function NotificationBell({ align = 'right' }: { align?: 'right' | 'left' }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  /**
   * Fetch notifications on mount and set up polling
   */
  useEffect(() => {
    loadNotifications()

    // Poll for new notifications every 5 minutes
    const interval = setInterval(() => {
      loadNotifications()
    }, 300000)

    return () => clearInterval(interval)
  }, [])

  /**
   * Reload notifications when page becomes visible
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadNotifications()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  /**
   * Load notifications from API
   */
  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getNotifications(false, 0, 20)
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch (err) {
      console.error('Error loading notifications:', err)
    }
  }

  /**
   * Build correct navigation path based on notification data
   */
  const buildNotificationPath = async (notification: Notification): Promise<string | null> => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = {
        'Authorization': `Bearer ${token}`
      }

      let materialId = notification.related_material_id
      let discussionId = notification.related_discussion_id

      // If no direct IDs, try to extract from link
      if (!materialId && !discussionId && notification.link) {
        // Extract discussion_id from link like "/discussions/123"
        const discussionMatch = notification.link.match(/\/discussions\/(\d+)/)
        if (discussionMatch) {
          discussionId = parseInt(discussionMatch[1])
        }

        // Extract material_id from link like "/materials/123"
        const materialMatch = notification.link.match(/\/materials\/(\d+)/)
        if (materialMatch) {
          materialId = parseInt(materialMatch[1])
        }
      }

      // If we have discussion_id but no material_id, fetch it
      if (!materialId && discussionId) {
        const discussionResponse = await fetch(
          `${API_BASE}/api/v1/discussions/${discussionId}`,
          { headers }
        )

        if (discussionResponse.ok) {
          const discussion = await discussionResponse.json()
          materialId = discussion.material_id
        }
      }

      // Now fetch material details if we have material_id
      if (materialId) {
        const materialResponse = await fetch(
          `${API_BASE}/api/v1/materials/${materialId}`,
          { headers }
        )

        if (!materialResponse.ok) {
          console.error('Failed to fetch material details')
          return notification.link
        }

        const material = await materialResponse.json()

        // Build path: /courses/{course_id}/materials/{type}/{material_id}
        let path = `/courses/${material.course_id}/materials/${material.material_type}/${material.id}`

        // Add anchor to scroll to comment if exists
        if (notification.related_comment_id) {
          path += `#comment-${notification.related_comment_id}`
        }

        return path
      }

      // If we have discussion_id but no material_id, it's a course discussion (not material discussion)
      if (discussionId) {
        const discussionResponse = await fetch(
          `${API_BASE}/api/v1/discussions/${discussionId}`,
          { headers }
        )

        if (discussionResponse.ok) {
          const discussion = await discussionResponse.json()

          // Navigate to course page with discussion_id as query parameter
          let path = `/courses/${discussion.course_id}?discussion_id=${discussionId}`

          // Add comment anchor if exists
          if (notification.related_comment_id) {
            path += `&comment_id=${notification.related_comment_id}`
          }

          return path
        }
      }

      // Fallback to link from backend
      return notification.link
    } catch (err) {
      console.error('Error building notification path:', err)
      return notification.link
    }
  }

  /**
   * Handle notification click - mark as read and navigate
   */
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.is_read) {
        await notificationsAPI.markAsRead(notification.id)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
      }

      // Build correct path and navigate
      const path = await buildNotificationPath(notification)
      if (path) {
        setIsOpen(false)
        router.push(path)
      }
    } catch (err) {
      console.error('Error handling notification:', err)
    }
  }

  /**
   * Mark all notifications as read
   */
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return

    setIsLoading(true)
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
      alert('שגיאה בסימון כל ההתראות כנקראו')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Translate backend English message to Hebrew
   */
  const getHebrewMessage = (notification: Notification): string => {
    const msg = notification.message || ''

    // Extract actor name (first part before the verb)
    const actorMatch = msg.match(/^([^\s]+(?: [^\s]+)?) /)
    const actor = actorMatch ? actorMatch[1] : ''

    // Extract quoted title if present
    const titleMatch = msg.match(/'([^']+)'/)
    const title = titleMatch ? titleMatch[1] : ''

    // Extract star rating if present
    const starsMatch = msg.match(/(\d+) stars?/)
    const stars = starsMatch ? starsMatch[1] : ''

    switch (notification.type) {
      case NotificationType.COMMENT_ON_MATERIAL:
        return title
          ? `${actor} הגיב על החומר "${title}"`
          : `${actor} הגיב על החומר שלך`
      case NotificationType.COMMENT_ON_DISCUSSION:
        return title
          ? `${actor} הגיב על הדיון "${title}"`
          : `${actor} הגיב על הדיון שלך`
      case NotificationType.REPLY_TO_COMMENT:
        return title
          ? `${actor} הגיב לתגובה שלך בדיון "${title}"`
          : `${actor} הגיב לתגובה שלך`
      case NotificationType.MATERIAL_RATED:
        return title && stars
          ? `${actor} דירג את "${title}" עם ${stars} כוכבים`
          : `${actor} דירג את החומר שלך`
      default:
        return msg
    }
  }

  /**
   * Get notification icon based on type
   */
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.COMMENT_ON_MATERIAL:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        )
      case NotificationType.COMMENT_ON_DISCUSSION:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        )
      case NotificationType.REPLY_TO_COMMENT:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case NotificationType.MATERIAL_RATED:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        )
    }
  }

  /**
   * Format time ago
   */
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'עכשיו'
    if (seconds < 3600) return `לפני ${Math.floor(seconds / 60)} דקות`
    if (seconds < 86400) return `לפני ${Math.floor(seconds / 3600)} שעות`
    if (seconds < 604800) return `לפני ${Math.floor(seconds / 86400)} ימים`
    return `לפני ${Math.floor(seconds / 604800)} שבועות`
  }

  /**
   * Handle bell click - reload notifications before opening
   */
  const handleBellClick = async () => {
    if (!isOpen) {
      // Reload notifications before opening dropdown
      await loadNotifications()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative text-slate-400 hover:text-slate-600 transition-colors p-2"
        aria-label="התראות"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[560px] overflow-hidden flex flex-col`}>
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="text-xs bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isLoading}
                  className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                >
                  {isLoading ? 'מסמן...' : 'סמן הכל כנקרא'}
                </button>
              )}
              <h3 className="text-sm font-bold text-white">התראות</h3>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-slate-700 font-semibold text-sm">אין התראות חדשות</p>
                <p className="text-slate-400 text-xs mt-1">כל ההתראות שלך יופיעו כאן</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3.5 border-b border-gray-50 cursor-pointer transition-colors ${
                      notification.is_read
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Icon */}
                      <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg ${
                        notification.is_read ? 'bg-gray-100 text-gray-400' : 'bg-slate-900 text-white'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${
                          notification.is_read ? 'text-gray-500' : 'text-slate-800 font-medium'
                        }`}>
                          {getHebrewMessage(notification)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!notification.is_read && (
                        <div className="flex-shrink-0 mt-1.5">
                          <div className="w-2 h-2 bg-slate-900 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
