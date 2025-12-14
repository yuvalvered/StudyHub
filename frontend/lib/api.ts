/**
 * API Client for StudyHub Backend
 * מודול לתקשורת עם שרת הבקאנד
 *
 * Base URL: http://localhost:8000/api/v1
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Generic API request handler
 * פונקציה כללית לביצוע בקשות HTTP
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  // Default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add auth token if exists in localStorage
  // הוסף טוקן אימות אם קיים ב-localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return {} as T
    }

    const data = await response.json()

    if (!response.ok) {
      // Handle error response from backend
      throw new Error(data.detail || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred')
  }
}

/**
 * Authentication API
 * API לאימות משתמשים
 */
export const authAPI = {
  /**
   * Login with username and password
   * התחברות עם שם משתמש וסיסמה
   */
  login: async (username: string, password: string) => {
    const response = await apiRequest<{
      access_token: string
      refresh_token: string
      token_type: string
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })

    // Store tokens in localStorage
    // שמור טוקנים ב-localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
    }

    return response
  },

  /**
   * Register a new user
   * רישום משתמש חדש
   */
  register: async (userData: {
    username: string
    email: string
    password: string
    full_name: string
  }) => {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  /**
   * Logout - clear tokens
   * התנתקות - מחיקת טוקנים
   */
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  },

  /**
   * Check if user is logged in
   * בדוק אם המשתמש מחובר
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('access_token')
  },

  /**
   * Request password reset email
   * בקש מייל לאיפוס סיסמה
   */
  forgotPassword: async (email: string) => {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  /**
   * Reset password with token
   * אפס סיסמה עם טוקן
   */
  resetPassword: async (token: string, newPassword: string) => {
    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    })
  },

  /**
   * Verify email with token
   * אמת מייל עם טוקן
   */
  verifyEmail: async (token: string) => {
    return await apiRequest(`/auth/verify-email?token=${token}`, {
      method: 'GET',
    })
  },
}

/**
 * Courses API
 * API לקורסים
 */
export const coursesAPI = {
  /**
   * Get all courses
   * קבל את כל הקורסים
   */
  getAllCourses: async () => {
    return await apiRequest('/courses', {
      method: 'GET',
    })
  },

  /**
   * Get course by ID
   * קבל קורס לפי מזהה
   */
  getCourseById: async (courseId: string) => {
    return await apiRequest(`/courses/${courseId}`, {
      method: 'GET',
    })
  },
}

/**
 * Users API
 * API למשתמשים
 */
export const usersAPI = {
  /**
   * Get current user profile
   * קבל פרופיל של המשתמש הנוכחי
   */
  getCurrentUser: async () => {
    return await apiRequest('/users/me', {
      method: 'GET',
    })
  },

  /**
   * Get current user statistics
   * קבל סטטיסטיקות של המשתמש הנוכחי
   */
  getCurrentUserStats: async () => {
    return await apiRequest('/users/me/stats', {
      method: 'GET',
    })
  },

  /**
   * Get courses the current user is enrolled in
   * קבל את הקורסים שהמשתמש הנוכחי רשום אליהם
   */
  getMyCourses: async () => {
    return await apiRequest('/users/me/courses', {
      method: 'GET',
    })
  },
}
