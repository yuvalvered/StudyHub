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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add auth token if exists in localStorage
  // הוסף טוקן אימות אם קיים ב-localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Merge with provided headers
  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle 204 No Content (successful DELETE operations)
    if (response.status === 204) {
      return {} as T
    }

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
    department: string
    department_number: number
    year_in_degree: number
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

  /**
   * Get all materials for a course
   * קבל את כל החומרים של קורס
   */
  getCourseMaterials: async (courseId: string, materialType?: string) => {
    const params = materialType ? `?material_type=${materialType}` : ''
    return await apiRequest(`/courses/${courseId}/materials${params}`, {
      method: 'GET',
    })
  },

  /**
   * Get study partners for a course
   * קבל שותפי למידה לקורס
   */
  getStudyPartners: async (courseId: string) => {
    return await apiRequest(`/courses/${courseId}/study-partners`, {
      method: 'GET',
    })
  },

  /**
   * Search courses by name or number
   * חיפוש קורסים לפי שם או מספר
   */
  searchCourses: async (query: string) => {
    return await apiRequest(`/courses?search=${encodeURIComponent(query)}`, {
      method: 'GET',
    })
  },

  /**
   * Upload a new material to a course
   * העלאת חומר חדש לקורס
   */
  uploadMaterial: async (courseId: string, formData: FormData) => {
    // Get token for Authorization header
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    // Don't set Content-Type - let browser set it with boundary for multipart/form-data

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/materials`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * Download a material file
   * הורדת קובץ חומר לימוד
   */
  downloadMaterial: async (materialId: number, fileName: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/materials/${materialId}/download`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
    }

    // Get the blob from response
    const blob = await response.blob()

    // Create a download link and trigger download
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()

    // Cleanup
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  },

  /**
   * Get a single material by ID
   * קבלת חומר בודד לפי מזהה
   */
  getMaterialById: async (materialId: string) => {
    return await apiRequest(`/materials/${materialId}`, {
      method: 'GET',
    })
  },

  /**
   * Get all materials (optionally filtered)
   * קבלת כל החומרים
   */
  getAllMaterials: async (filters?: { course_id?: number; material_type?: string }) => {
    const params = new URLSearchParams()
    if (filters?.course_id) params.append('course_id', filters.course_id.toString())
    if (filters?.material_type) params.append('material_type', filters.material_type)

    const queryString = params.toString()
    return await apiRequest(`/materials${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    })
  },

  /**
   * Delete a material from a course
   * מחיקת חומר מקורס
   */
  deleteMaterial: async (courseId: string, materialId: number) => {
    return await apiRequest(`/courses/${courseId}/materials/${materialId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Create a new course (Admin only)
   * יצירת קורס חדש (אדמין בלבד)
   */
  createCourse: async (courseData: {
    course_name: string
    course_number: string
    department: string
    description?: string
  }) => {
    return await apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    })
  },

  /**
   * Delete a course (Admin only)
   * מחיקת קורס (אדמין בלבד)
   */
  deleteCourse: async (courseId: number) => {
    return await apiRequest(`/courses/${courseId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Rate a material
   * דירוג חומר לימוד
   */
  rateMaterial: async (materialId: number, rating: number, comment?: string) => {
    return await apiRequest(`/materials/${materialId}/rate`, {
      method: 'POST',
      body: JSON.stringify({
        rating: rating,
        material_id: materialId,
        comment: comment
      })
    })
  },

  /**
   * Get current user's rating for a material
   * קבל את הדירוג של המשתמש הנוכחי לחומר
   */
  getUserMaterialRating: async (materialId: number) => {
    try {
      // Try to get all ratings for the material
      const ratings = await apiRequest(`/materials/${materialId}/ratings`, {
        method: 'GET',
      }) as any[]

      // Find the current user's rating from the list
      const currentUser = await usersAPI.getCurrentUser() as any
      return ratings.find((r: any) => r.user_id === currentUser.id) || null
    } catch (err) {
      return null
    }
  },

  /**
   * Update existing rating
   * עדכן דירוג קיים
   */
  updateMaterialRating: async (materialId: number, rating: number, comment?: string) => {
    return await apiRequest(`/materials/${materialId}/rate`, {
      method: 'PUT',
      body: JSON.stringify({
        rating: rating,
        comment: comment
      })
    })
  },

  /**
   * Report a material
   * דיווח על חומר
   */
  reportMaterial: async (materialId: number) => {
    return await apiRequest(`/materials/${materialId}/report`, {
      method: 'POST',
    })
  },

  /**
   * Unreport a material (cancel report)
   * ביטול דיווח על חומר
   */
  unreportMaterial: async (materialId: number) => {
    return await apiRequest(`/materials/${materialId}/report`, {
      method: 'DELETE',
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

  /**
   * Enroll current user in a course
   * רישום המשתמש הנוכחי לקורס
   */
  enrollInCourse: async (courseId: number, lookingForPartner: boolean = false) => {
    return await apiRequest('/users/me/courses', {
      method: 'POST',
      body: JSON.stringify({
        course_id: courseId,
        looking_for_study_partner: lookingForPartner
      })
    })
  },

  /**
   * Unenroll current user from a course
   * ביטול רישום המשתמש הנוכחי מקורס
   */
  unenrollFromCourse: async (courseId: number) => {
    return await apiRequest(`/users/me/courses/${courseId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Update course enrollment settings
   * עדכון הגדרות רישום לקורס
   */
  updateCourseEnrollment: async (courseId: number, lookingForPartner: boolean) => {
    return await apiRequest(`/users/me/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        looking_for_study_partner: lookingForPartner
      })
    })
  },

  /**
   * Get user by ID
   * קבל משתמש לפי מזהה
   */
  getUserById: async (userId: number) => {
    return await apiRequest(`/users/${userId}`, {
      method: 'GET',
    })
  },

  /**
   * Update current user profile
   * עדכן פרופיל משתמש נוכחי
   */
  updateUserProfile: async (userData: {
    full_name?: string
    year_in_degree?: number
    department?: string
    department_number?: number
    bio?: string
  }) => {
    return await apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },

  /**
   * Upload profile image
   * העלה תמונת פרופיל
   */
  uploadProfileImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) {
      throw new Error('No access token found')
    }

    const response = await fetch(`${API_BASE_URL}/users/me/profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(errorData.detail || 'Failed to upload profile image')
    }

    return await response.json()
  },

  /**
   * Delete profile image
   * מחק תמונת פרופיל
   */
  deleteProfileImage: async () => {
    return await apiRequest('/users/me/profile-image', {
      method: 'DELETE',
    })
  },
}

/**
 * Discussions API
 * API לדיונים
 */
export const discussionsAPI = {
  /**
   * Get discussion for a material
   * קבל דיון עבור חומר לימוד
   * The discussion is automatically created by the backend when the material is created
   */
  getMaterialDiscussion: async (materialId: string) => {
    return await apiRequest(`/materials/${materialId}/discussion`, {
      method: 'GET',
    })
  },

  /**
   * Get comments for a discussion
   * קבל תגובות לדיון
   */
  getDiscussionComments: async (discussionId: number) => {
    return await apiRequest(`/discussions/${discussionId}/comments`, {
      method: 'GET',
    })
  },

  /**
   * Create a new comment on a discussion
   * צור תגובה חדשה על דיון
   */
  createComment: async (discussionId: number, content: string, parentCommentId?: number) => {
    return await apiRequest(`/discussions/${discussionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        parent_comment_id: parentCommentId || null
      })
    })
  },

  /**
   * Delete a comment
   * מחק תגובה
   */
  deleteComment: async (commentId: number) => {
    return await apiRequest(`/comments/${commentId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Vote on a comment
   * הצבע על תגובה
   */
  voteComment: async (commentId: number, voteType: 'upvote' | 'downvote') => {
    return await apiRequest(`/comments/${commentId}/vote`, {
      method: 'POST',
      body: JSON.stringify({
        vote_type: voteType
      })
    })
  },

  /**
   * Get all discussions for a course
   * קבל כל הדיונים של קורס
   */
  getCourseDiscussions: async (courseId: string) => {
    return await apiRequest(`/courses/${courseId}/discussions`, {
      method: 'GET',
    })
  },

  /**
   * Get a specific discussion by ID
   * קבל דיון ספציפי לפי מזהה
   */
  getDiscussion: async (discussionId: number) => {
    return await apiRequest(`/discussions/${discussionId}`, {
      method: 'GET',
    })
  },

  /**
   * Create a new course discussion
   * צור דיון חדש לקורס
   */
  createCourseDiscussion: async (courseId: string, title: string, content: string) => {
    return await apiRequest(`/courses/${courseId}/discussions`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        content
      })
    })
  },
}
