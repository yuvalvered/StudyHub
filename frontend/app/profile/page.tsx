'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, usersAPI, coursesAPI } from '@/lib/api'
import { notificationsAPI, NotificationSettings } from '@/lib/api/notifications'
import NotificationBell from '@/components/NotificationBell'

const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null
  if (path.startsWith('http')) return path
  if (path.startsWith('data:')) return path
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  const serverUrl = apiUrl.replace('/api/v1', '')
  return `${serverUrl}/${path}`
}

const getYearInHebrew = (year: number | null | undefined): string => {
  if (!year) return 'לא צוינה'
  const map: { [key: number]: string } = { 1: "א'", 2: "ב'", 3: "ג'", 4: "ד'" }
  return map[year] || year.toString()
}

function NotifToggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs font-medium transition-all select-none ${
        checked
          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${checked ? 'bg-white' : 'bg-gray-300'}`} />
      {label}
    </button>
  )
}

export default function ProfilePage() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [profileImgError, setProfileImgError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<any>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authAPI.isAuthenticated()) { router.push('/login'); return }

        const [userData, statsData, allMaterials] = await Promise.all([
          usersAPI.getCurrentUser(),
          usersAPI.getCurrentUserStats(),
          coursesAPI.getAllMaterials()
        ])

        const userMaterials = Array.isArray(allMaterials)
          ? allMaterials.filter((m: any) => m.uploader_id === (userData as any).id)
          : []

        let weightedAverageRating = 0
        if (userMaterials.length > 0) {
          const totalPoints = userMaterials.reduce((s: number, m: any) => s + (m.average_rating || 0) * (m.rating_count || 0), 0)
          const totalRatings = userMaterials.reduce((s: number, m: any) => s + (m.rating_count || 0), 0)
          if (totalRatings > 0) weightedAverageRating = totalPoints / totalRatings
        }

        setUser({ ...(userData as any), average_rating: weightedAverageRating })
        setStats(statsData)
        setIsLoading(false)
      } catch (err) {
        setError('שגיאה בטעינת נתוני המשתמש')
        setIsLoading(false)
      }
    }

    fetchUserData()
    const onVisible = () => { if (!document.hidden) fetchUserData() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [router])

  useEffect(() => {
    if (!authAPI.isAuthenticated()) return
    setIsLoadingSettings(true)
    notificationsAPI.getSettings()
      .then(setNotificationSettings)
      .catch(console.error)
      .finally(() => setIsLoadingSettings(false))
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      alert('אנא העלה קובץ תמונה בפורמט JPG, PNG או GIF'); return
    }
    if (file.size > 5 * 1024 * 1024) { alert('גודל התמונה חורג מ-5MB'); return }

    setUploadingImage(true)
    try {
      const updatedUser = await usersAPI.uploadProfileImage(file)
      setUser(updatedUser)
      setProfileImgError(false)
    } catch (err) {
      alert('שגיאה בהעלאת התמונה: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setUploadingImage(false)
    }
  }

  const saveProfile = async () => {
    try {
      const updateData: any = {}
      if (editedUser.full_name !== user.full_name) updateData.full_name = editedUser.full_name
      if (editedUser.department !== user.department) updateData.department = editedUser.department
      if (editedUser.year_in_degree !== user.year_in_degree) updateData.year_in_degree = parseInt(editedUser.year_in_degree)
      await usersAPI.updateUserProfile(updateData)
      const refreshed = await usersAPI.getCurrentUser()
      setUser(refreshed)
      setIsEditing(false)
    } catch (err) {
      alert('שגיאה בעדכון הפרטים: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleNotificationToggle = async (field: keyof NotificationSettings, value: boolean) => {
    if (!notificationSettings) return
    const updated = { ...notificationSettings, [field]: value }
    setNotificationSettings(updated)
    setIsSavingSettings(true)
    try {
      const saved = await notificationsAPI.updateSettings({ [field]: value })
      setNotificationSettings(saved)
    } catch {
      setNotificationSettings(notificationSettings)
      alert('שגיאה בעדכון הגדרות ההתראות')
    } finally {
      setIsSavingSettings(false)
    }
  }

  if (isLoading) {
    return (
      <div dir="rtl" className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">טוען פרופיל...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div dir="rtl" className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="bg-slate-900 text-white px-6 py-2 rounded-xl">חזרה</button>
        </div>
      </div>
    )
  }

  const displayName = user?.full_name || user?.username || ''
  const initials = displayName.charAt(0)
  const imageUrl = getImageUrl(user?.profile_image_url)

  return (
    <div dir="rtl" className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Sidebar */}
      <aside className="fixed right-0 top-0 h-full w-16 bg-slate-900 flex flex-col items-center py-4 z-40">
        {/* Logo */}
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center mb-6 flex-shrink-0">
          <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        {/* Back to dashboard */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="חזרה לדשבורד"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {/* Logout at bottom */}
        <button
          onClick={() => { authAPI.logout(); router.push('/login') }}
          className="mt-auto w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
          title="התנתק"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </aside>

      {/* Main */}
      <div className="mr-16 flex flex-col flex-1 min-h-screen overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between flex-shrink-0">
          <h1 className="text-base font-bold text-slate-800">הפרופיל שלי</h1>
          <NotificationBell align="left" />
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Banner */}
              <div className="h-24 bg-gradient-to-l from-slate-800 to-slate-600" />

              {/* Content row */}
              <div className="px-8 pb-6">
                <div className="flex items-end gap-6 -mt-12 mb-5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 mr-auto">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-indigo-500 flex items-center justify-center shadow-lg border-4 border-white">
                      {imageUrl && !profileImgError ? (
                        <img src={imageUrl} alt="תמונת פרופיל" className="w-full h-full object-cover" onError={() => setProfileImgError(true)} />
                      ) : (
                        <span className="text-white text-4xl font-bold">{initials}</span>
                      )}
                    </div>
                    <label
                      htmlFor="profile-image-upload"
                      className="absolute -bottom-2 -left-2 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors border-2 border-white"
                    >
                      {uploadingImage ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                      ) : (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </label>
                    <input id="profile-image-upload" type="file" accept="image/jpeg,image/jpg,image/png,image/gif" onChange={handleImageUpload} className="hidden" />
                  </div>

                  {/* Name + edit — aligned to bottom of avatar */}
                  <div className="flex-1 text-right pb-1">
                    <h2 className="text-2xl font-bold text-slate-800">{displayName}</h2>
                    {!isEditing && (
                      <button
                        onClick={() => { setEditedUser({ ...user }); setIsEditing(true) }}
                        className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors mr-auto"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        ערוך פרטים
                      </button>
                    )}
                  </div>
                </div>

              {/* Info or edit form */}
              {!isEditing ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-start gap-2">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-slate-700 truncate">{user?.email}</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-start gap-2">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm text-slate-700 truncate">{user?.department || 'לא צוינה מחלקה'}</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-start gap-2">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-sm text-slate-700">שנה {getYearInHebrew(user?.year_in_degree)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-w-sm mx-auto">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 text-right">שם מלא</label>
                    <input type="text" value={editedUser?.full_name || ''} onChange={e => setEditedUser({ ...editedUser, full_name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 text-right">אימייל (לא ניתן לעריכה)</label>
                    <input type="email" value={editedUser?.email || ''} disabled
                      className="w-full px-3 py-2 text-sm border border-gray-100 rounded-xl bg-gray-50 text-slate-400 cursor-not-allowed text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 text-right">מחלקה / תואר</label>
                    <input type="text" value={editedUser?.department || ''} onChange={e => setEditedUser({ ...editedUser, department: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-right" placeholder="לדוגמה: מדעי המחשב" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 text-right">שנת לימוד</label>
                    <select value={editedUser?.year_in_degree || ''} onChange={e => setEditedUser({ ...editedUser, year_in_degree: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-right">
                      <option value="">בחר שנה</option>
                      <option value="1">שנה א'</option>
                      <option value="2">שנה ב'</option>
                      <option value="3">שנה ג'</option>
                      <option value="4">שנה ד'</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-slate-600 hover:bg-gray-50 transition-colors">ביטול</button>
                    <button onClick={saveProfile} className="flex-1 py-2 text-sm bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">שמור</button>
                  </div>
                </div>
              )}
              </div>{/* closes px-8 pb-6 */}
            </div>

            {/* Stats + Notifications side by side — 50/50 */}
            <div className="flex gap-4 items-stretch">

              {/* Stats — 50% */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
                <h2 className="text-sm font-bold text-slate-700 mb-5 text-right">סטטיסטיקות</h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-2xl p-5 flex items-center gap-4">
                    <div className="flex-1 text-right">
                      <p className="text-4xl font-bold text-blue-600">{stats?.uploads_count || 0}</p>
                      <p className="text-sm text-slate-500 mt-1">קבצים שהעליתי</p>
                    </div>
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-5 flex items-center gap-4">
                    <div className="flex-1 text-right">
                      <p className="text-4xl font-bold text-green-600">{stats?.downloads_received || 0}</p>
                      <p className="text-sm text-slate-500 mt-1">הורדות שקיבלתי</p>
                    </div>
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-2xl p-5 flex items-center gap-4">
                    <div className="flex-1 text-right">
                      <p className="text-4xl font-bold text-yellow-600">{user?.average_rating?.toFixed(1) || '0.0'}</p>
                      <p className="text-sm text-slate-500 mt-1">דירוג ממוצע</p>
                    </div>
                    <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Settings — 50% */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-bold text-slate-700">העדפות התראות</h2>
                  <div>{isSavingSettings && <span className="text-xs text-slate-400">שומר...</span>}</div>
                </div>

                {isLoadingSettings ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
                  </div>
                ) : notificationSettings ? (
                  <div className="divide-y divide-gray-50">
                    {[
                      { label: 'תגובה על חומר שהעליתי', appField: 'comment_on_material_in_app' as keyof NotificationSettings, emailField: 'comment_on_material_email' as keyof NotificationSettings },
                      { label: 'תגובה על דיון שיצרתי', appField: 'comment_on_discussion_in_app' as keyof NotificationSettings, emailField: 'comment_on_discussion_email' as keyof NotificationSettings },
                      { label: 'תגובה לתגובה שכתבתי', appField: 'reply_to_comment_in_app' as keyof NotificationSettings, emailField: 'reply_to_comment_email' as keyof NotificationSettings },
                      { label: 'דירוג על חומר שהעליתי', appField: 'material_rated_in_app' as keyof NotificationSettings, emailField: 'material_rated_email' as keyof NotificationSettings },
                    ].map(({ label, appField, emailField }) => (
                      <div key={appField} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-700">{label}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <NotifToggle
                            label="באתר"
                            checked={notificationSettings[appField] as boolean}
                            onChange={v => handleNotificationToggle(appField, v)}
                            disabled={isSavingSettings}
                          />
                          <NotifToggle
                            label="מייל"
                            checked={notificationSettings[emailField] as boolean}
                            onChange={v => handleNotificationToggle(emailField, v)}
                            disabled={isSavingSettings}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-400 py-4">לא ניתן לטעון הגדרות</p>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-900 rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-xs mb-2">צור קשר</p>
              <a
                href="mailto:Bgustudyhub@gmail.com"
                className="inline-flex items-center gap-2 text-white hover:text-slate-300 transition-colors text-sm font-medium mb-5"
              >
                Bgustudyhub@gmail.com
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
              <div className="border-t border-slate-700 pt-4">
                <p className="text-slate-400 text-xs mb-1">נוצר על ידי</p>
                <p className="text-white text-sm font-medium">הדר עזריה, רוני גורליצקי, יובל ורד, נעם וקנין</p>
                <p className="text-slate-500 text-xs mt-3">אוניברסיטת בן-גוריון בנגב · © 2025 StudyHub</p>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
