'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { authAPI, usersAPI } from '@/lib/api'

/**
 * Profile Page Component
 * עמוד הפרופיל האישי
 * נמצא ב: /profile
 *
 * Features:
 * - Display user profile picture (circular)
 * - Upload/change profile picture
 * - Display user statistics (uploads, downloads, average rating)
 * - Display user information
 * - Footer with contact info and credits
 */
export default function ProfilePage() {
  const router = useRouter()

  // State management
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<any>(null)

  /**
   * Fetch user data on mount
   */
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if user is authenticated
        if (!authAPI.isAuthenticated()) {
          router.push('/login')
          return
        }

        // Fetch user profile and stats
        const [userData, statsData] = await Promise.all([
          usersAPI.getCurrentUser(),
          usersAPI.getCurrentUserStats()
        ])

        setUser(userData)
        setStats(statsData)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('שגיאה בטעינת נתוני המשתמש')
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  /**
   * Handle profile picture upload
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      alert('אנא העלה קובץ תמונה בפורמט JPG או PNG')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('גודל התמונה חורג מ-5MB')
      return
    }

    setUploadingImage(true)

    try {
      // TODO: Implement image upload to backend
      // For now, we'll use a local preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setUser({ ...user, profile_image_url: imageUrl })
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)

      console.log('Image upload will be implemented with backend API')
    } catch (err) {
      console.error('Error uploading image:', err)
      alert('שגיאה בהעלאת התמונה')
      setUploadingImage(false)
    }
  }

  /**
   * Handle logout
   */
  const handleLogout = () => {
    authAPI.logout()
    router.push('/login')
  }

  /**
   * Go back to dashboard
   */
  const goToDashboard = () => {
    router.push('/dashboard')
  }

  /**
   * Start editing profile
   */
  const startEditing = () => {
    setEditedUser({ ...user })
    setIsEditing(true)
  }

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditedUser(null)
    setIsEditing(false)
  }

  /**
   * Save profile changes
   */
  const saveProfile = async () => {
    try {
      // TODO: Implement API call to update user profile
      setUser(editedUser)
      setIsEditing(false)
      console.log('Profile updated:', editedUser)
      alert('הפרטים עודכנו בהצלחה!')
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('שגיאה בעדכון הפרטים')
    }
  }

  /**
   * Handle input change for editing
   */
  const handleInputChange = (field: string, value: string) => {
    setEditedUser({ ...editedUser, [field]: value })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-16 w-16 text-primary-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-secondary-600">טוען נתונים...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 btn-primary px-6 py-2"
          >
            חזרה לדשבורד
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-primary-700 shadow-md z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Right side - Logo */}
            <Logo size="md" variant="light" />

            {/* Left side - Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={goToDashboard}
                className="text-white/90 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-medium">הקורסים שלי</span>
              </button>

              <button
                onClick={handleLogout}
                className="text-white/90 hover:text-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">התנתק</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Picture Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex flex-col items-center">
              {/* Profile Picture with Upload Button */}
              <div className="relative mb-6">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                  {user?.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl text-white font-bold">
                      {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>

                {/* Upload Button - Plus Icon */}
                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-0 right-0 w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-lg border-4 border-white"
                >
                  {uploadingImage ? (
                    <svg
                      className="animate-spin h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </label>
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* User Info - Editable */}
              {!isEditing ? (
                <>
                  <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                    {user?.full_name || user?.username}
                  </h1>
                  <p className="text-secondary-500 text-sm mb-1">{user?.email}</p>
                  <p className="text-secondary-600 mb-1">
                    {user?.department || 'לא צוין תואר'}
                  </p>
                  <p className="text-secondary-600 mb-4">
                    שנה {user?.year_of_study || 'לא צוינה'}
                  </p>

                  <button
                    onClick={startEditing}
                    className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    ערוך פרטים
                  </button>
                </>
              ) : (
                <div className="w-full max-w-md space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      שם מלא
                    </label>
                    <input
                      type="text"
                      value={editedUser?.full_name || ''}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="הזן שם מלא"
                    />
                  </div>

                  {/* Email - Not Editable */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      אימייל (לא ניתן לעריכה)
                    </label>
                    <input
                      type="email"
                      value={editedUser?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-secondary-200 rounded-lg bg-secondary-50 text-secondary-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Department/Major */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      תואר/מחלקה
                    </label>
                    <input
                      type="text"
                      value={editedUser?.department || ''}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="לדוגמה: מדעי המחשב"
                    />
                  </div>

                  {/* Year of Study */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      שנת לימוד
                    </label>
                    <select
                      value={editedUser?.year_of_study || ''}
                      onChange={(e) => handleInputChange('year_of_study', e.target.value)}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">בחר שנה</option>
                      <option value="1">שנה א'</option>
                      <option value="2">שנה ב'</option>
                      <option value="3">שנה ג'</option>
                      <option value="4">שנה ד'</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={saveProfile}
                      className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      שמור
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex-1 px-6 py-2 bg-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-400 transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6 text-center">
              סטטיסטיקות
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Uploads Count */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-3">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-blue-600 mb-2">
                  {stats?.uploads_count || 0}
                </p>
                <p className="text-secondary-700 font-medium">קבצים שהעלאתי</p>
              </div>

              {/* Downloads Received */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-3">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-green-600 mb-2">
                  {stats?.downloads_received || 0}
                </p>
                <p className="text-secondary-700 font-medium">הורדות שקיבלתי</p>
              </div>

              {/* Average Rating */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-3">
                  <svg className="w-12 h-12 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-yellow-600 mb-2">
                  {stats?.average_rating?.toFixed(1) || '0.0'}
                </p>
                <p className="text-secondary-700 font-medium">דירוג ממוצע</p>
              </div>
            </div>
          </div>

          {/* Additional Info Section (Optional) */}
          {(user?.department || user?.year_of_study) && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-secondary-900 mb-6 text-center">
                מידע נוסף
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user?.department && (
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <p className="text-secondary-600 text-sm mb-1">מחלקה</p>
                    <p className="text-secondary-900 font-medium">{user.department}</p>
                  </div>
                )}
                {user?.year_of_study && (
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <p className="text-secondary-600 text-sm mb-1">שנת לימוד</p>
                    <p className="text-secondary-900 font-medium">שנה {user.year_of_study}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Contact Info */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-3">צור קשר</h3>
              <a
                href="mailto:Bgustudyhub@gmail.com"
                className="inline-flex items-center gap-2 text-primary-300 hover:text-primary-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Bgustudyhub@gmail.com
              </a>
            </div>

            {/* Divider */}
            <div className="border-t border-secondary-700 mb-6"></div>

            {/* Credits */}
            <div className="text-center">
              <p className="text-secondary-300 mb-2">נוצר על ידי:</p>
              <p className="text-white font-medium">
                הדר עזריה, רוני גורליצקי, יובל ורד, נעם וקנין
              </p>
              <p className="text-secondary-400 text-sm mt-4">
                אוניברסיטת בן-גוריון בנגב
              </p>
              <p className="text-secondary-500 text-xs mt-2">
                © 2024 StudyHub. כל הזכויות שמורות.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
