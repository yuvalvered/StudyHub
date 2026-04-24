'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import { authAPI, usersAPI, coursesAPI } from '@/lib/api'

interface Course {
  id: string
  courseId: string
  name: string
  courseNumber: string
  department?: string
  lookingForPartner: boolean
}

const COURSE_COLORS = [
  { stripe: 'bg-red-400',    iconBg: 'bg-red-100',    iconColor: 'text-red-500'    },
  { stripe: 'bg-teal-400',   iconBg: 'bg-teal-100',   iconColor: 'text-teal-500'   },
  { stripe: 'bg-blue-400',   iconBg: 'bg-blue-100',   iconColor: 'text-blue-500'   },
  { stripe: 'bg-orange-400', iconBg: 'bg-orange-100', iconColor: 'text-orange-500' },
  { stripe: 'bg-purple-400', iconBg: 'bg-purple-100', iconColor: 'text-purple-500' },
  { stripe: 'bg-yellow-400', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
]

const COURSE_ICONS = [
  <svg key="clock" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="grid" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  <svg key="table" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3z" /></svg>,
  <svg key="chart" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  <svg key="book" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  <svg key="beaker" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
]

function getSemesterLabel(): string {
  const month = new Date().getMonth() + 1
  const year = new Date().getFullYear()
  if (month >= 10) return `סמסטר א׳ · ${year}`
  if (month >= 8)  return `סמסטר קיץ · ${year}`
  return `סמסטר ב׳ · ${year}`
}

export default function DashboardPage() {
  const router = useRouter()

  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Enroll modal (regular users)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollQuery, setEnrollQuery] = useState('')
  const [enrollResults, setEnrollResults] = useState<any[]>([])
  const [isEnrollSearching, setIsEnrollSearching] = useState(false)
  const [enrollingId, setEnrollingId] = useState<number | null>(null)

  // Admin panel
  const [profileImgError, setProfileImgError] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [adminTab, setAdminTab] = useState<'add' | 'delete'>('add')
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseNumber, setNewCourseNumber] = useState('')
  const [newCourseDepartment, setNewCourseDepartment] = useState('')
  const [newCourseDescription, setNewCourseDescription] = useState('')
  const [deleteSearchQuery, setDeleteSearchQuery] = useState('')
  const [deleteSearchResults, setDeleteSearchResults] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!authAPI.isAuthenticated()) { router.push('/login'); return }
        const [courses, userData]: any = await Promise.all([usersAPI.getMyCourses(), usersAPI.getCurrentUser()])
        setCurrentUser(userData)
        setMyCourses(courses.map((c: any) => ({
          id: c.id.toString(),
          courseId: c.course_id.toString(),
          name: c.course_name,
          courseNumber: c.course_number,
          department: c.department,
          lookingForPartner: c.looking_for_study_partner
        })))
        setIsLoading(false)
      } catch (err: any) {
        if (err.message?.includes('Could not validate credentials') || err.message?.includes('401')) {
          authAPI.logout(); router.push('/login'); return
        }
        setError('שגיאה בטעינת הקורסים')
        setIsLoading(false)
      }
    }
    fetchData()
  }, [router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.search-container')) setShowSearchResults(false)
      if (!target.closest('.menu-container')) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!showEnrollModal) { setEnrollQuery(''); setEnrollResults([]) }
  }, [showEnrollModal])

  const handleLogout = () => { authAPI.logout(); router.push('/login') }

  // Header search
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 3) { setShowSearchResults(false); setSearchResults([]); return }
    try {
      const results = await coursesAPI.searchCourses(query)
      setSearchResults(Array.isArray(results) ? results : [])
      setShowSearchResults(true)
    } catch { setSearchResults([]) }
  }

  // Enroll modal search
  const handleEnrollSearch = async (query: string) => {
    setEnrollQuery(query)
    if (query.length < 2) { setEnrollResults([]); return }
    setIsEnrollSearching(true)
    try {
      const results = await coursesAPI.searchCourses(query)
      setEnrollResults(Array.isArray(results) ? results : [])
    } catch { setEnrollResults([]) }
    finally { setIsEnrollSearching(false) }
  }

  const addCourse = async (courseToAdd: any) => {
    try {
      setEnrollingId(courseToAdd.id)
      const enrollment = await usersAPI.enrollInCourse(courseToAdd.id, false) as any
      setMyCourses(prev => [...prev, {
        id: enrollment.id?.toString() || Date.now().toString(),
        courseId: courseToAdd.id.toString(),
        name: courseToAdd.course_name,
        courseNumber: courseToAdd.course_number,
        department: courseToAdd.department,
        lookingForPartner: false
      }])
      setShowEnrollModal(false)
    } catch (err: any) {
      alert(err.message?.includes('already enrolled') ? 'כבר רשומה לקורס זה' : 'שגיאה בהוספת הקורס')
    } finally { setEnrollingId(null) }
  }

  const addCourseFromHeader = async (courseToAdd: any) => {
    try {
      const enrollment = await usersAPI.enrollInCourse(courseToAdd.id, false) as any
      setMyCourses(prev => [...prev, {
        id: enrollment.id?.toString() || Date.now().toString(),
        courseId: courseToAdd.id.toString(),
        name: courseToAdd.course_name,
        courseNumber: courseToAdd.course_number,
        department: courseToAdd.department,
        lookingForPartner: false
      }])
      setSearchQuery(''); setShowSearchResults(false); setSearchResults([])
    } catch (err: any) {
      alert(err.message?.includes('already enrolled') ? 'כבר רשומה לקורס זה' : 'שגיאה בהוספת הקורס')
    }
  }

  const removeCourse = async (enrollmentId: string, courseId: string) => {
    try {
      await usersAPI.unenrollFromCourse(parseInt(courseId))
      setMyCourses(prev => prev.filter(c => c.id !== enrollmentId))
      setOpenMenuId(null)
    } catch { alert('שגיאה בהסרת הקורס') }
  }

  const toggleLookingForPartner = async (enrollmentId: string) => {
    const course = myCourses.find(c => c.id === enrollmentId)
    if (!course) return
    const newValue = !course.lookingForPartner
    setMyCourses(prev => prev.map(c => c.id === enrollmentId ? { ...c, lookingForPartner: newValue } : c))
    try {
      await usersAPI.updateCourseEnrollment(parseInt(course.courseId), newValue)
    } catch (apiErr: any) {
      if (!apiErr.message?.includes('501') && !apiErr.message?.includes('not implemented')) {
        setMyCourses(prev => prev.map(c => c.id === enrollmentId ? { ...c, lookingForPartner: !newValue } : c))
      }
    }
  }

  const goToCourse = async (courseId: string, courseData?: any) => {
    if (courseData && !myCourses.some(c => c.courseId === courseId)) {
      try {
        const enrollment = await usersAPI.enrollInCourse(parseInt(courseId), false) as any
        setMyCourses(prev => [...prev, {
          id: enrollment.id?.toString() || Date.now().toString(),
          courseId, name: courseData.course_name, courseNumber: courseData.course_number, lookingForPartner: false
        }])
      } catch (err: any) {
        if (!err.message?.includes('already enrolled')) { alert('שגיאה ברישום לקורס'); return }
      }
    }
    router.push(`/courses/${courseId}`)
  }

  // Admin: add course to DB
  const handleAddCourse = async () => {
    if (!newCourseName || !newCourseNumber || !newCourseDepartment) { alert('נא למלא את כל השדות הנדרשים'); return }
    try {
      await coursesAPI.createCourse({ course_name: newCourseName, course_number: newCourseNumber, department: newCourseDepartment, description: newCourseDescription || undefined })
      setNewCourseName(''); setNewCourseNumber(''); setNewCourseDepartment(''); setNewCourseDescription('')
      alert(`הקורס "${newCourseName}" נוסף בהצלחה!`)
    } catch (err: any) { alert('שגיאה בהוספת הקורס: ' + (err.message || '')) }
  }

  // Admin: delete course
  const handleDeleteSearch = async (q: string) => {
    setDeleteSearchQuery(q)
    if (q.length < 2) { setDeleteSearchResults([]); return }
    try {
      const results = await coursesAPI.searchCourses(q)
      setDeleteSearchResults(Array.isArray(results) ? results : [])
    } catch { setDeleteSearchResults([]) }
  }

  const handleDeleteCourse = async (courseId: number, courseName: string) => {
    if (!confirm(`האם למחוק את "${courseName}"?\nפעולה זו תמחק גם את כל החומרים הקשורים.`)) return
    try {
      await coursesAPI.deleteCourse(courseId)
      setDeleteSearchResults(prev => prev.filter(c => c.id !== courseId))
      alert(`הקורס "${courseName}" נמחק!`)
    } catch (err: any) { alert('שגיאה במחיקה: ' + (err.message || '')) }
  }

  const firstName = currentUser?.full_name?.split(' ')[0] || currentUser?.username || ''
  const uploadsCount = currentUser?.uploads_count ?? 0
  const downloadsCount = currentUser?.downloads_received ?? 0

  return (
    <div dir="rtl" className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ===== RIGHT SIDEBAR ===== */}
      <aside className="fixed right-0 top-0 h-full w-16 bg-slate-900 flex flex-col items-center py-5 z-50 gap-1">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-4 flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <button onClick={() => router.push('/dashboard')} title="הקורסים שלי"
            className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>

          <button onClick={() => router.push('/courses')} title="כל הקורסים"
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>

          {currentUser?.is_admin && (
            <button onClick={() => setShowAdminPanel(true)} title="ניהול קורסים"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showAdminPanel ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </nav>

        <button onClick={() => router.push('/profile')} title="פרופיל אישי"
          className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center relative mt-auto flex-shrink-0">
          {currentUser?.profile_image_url && !profileImgError ? (
            <img
              src={`http://localhost:8000/${currentUser.profile_image_url.replace(/\\/g, '/')}`}
              alt="תמונת פרופיל"
              className="w-full h-full object-cover"
              onError={() => setProfileImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{firstName.charAt(0)}</span>
            </div>
          )}
          <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
        </button>
      </aside>

      {/* ===== ADMIN PANEL (slide-in drawer) ===== */}
      {showAdminPanel && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowAdminPanel(false)} />
          <div className="fixed right-16 top-0 h-full w-80 bg-white shadow-2xl z-40 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-amber-50">
              <button onClick={() => setShowAdminPanel(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="font-bold text-slate-800">סרגל אדמין</h2>
              </div>
            </div>

            <div className="flex border-b border-gray-100">
              <button onClick={() => setAdminTab('add')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${adminTab === 'add' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                הוספת קורס
              </button>
              <button onClick={() => setAdminTab('delete')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${adminTab === 'delete' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-700'}`}>
                מחיקת קורס
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {adminTab === 'add' ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">הוסף קורס חדש למסד הנתונים.</p>
                  {[
                    { label: 'שם הקורס', value: newCourseName, setter: setNewCourseName, placeholder: 'מבוא למדעי המחשב', required: true },
                    { label: 'מספר קורס', value: newCourseNumber, setter: setNewCourseNumber, placeholder: '12345', required: true },
                    { label: 'מחלקה', value: newCourseDepartment, setter: setNewCourseDepartment, placeholder: 'מדעי המחשב', required: true },
                  ].map(({ label, value, setter, placeholder, required }) => (
                    <div key={label}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {label}{required && <span className="text-red-500 mr-1">*</span>}
                      </label>
                      <input type="text" value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">תיאור (אופציונלי)</label>
                    <textarea value={newCourseDescription} onChange={e => setNewCourseDescription(e.target.value)} rows={3} placeholder="תיאור קצר..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" />
                  </div>
                  <button onClick={handleAddCourse}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
                    הוסף קורס למסד הנתונים
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">מחיקה תסיר גם את כל החומרים הקשורים.</p>
                  <input type="text" value={deleteSearchQuery} onChange={e => handleDeleteSearch(e.target.value)}
                    placeholder="חפש קורס למחיקה..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none" />
                  <div className="space-y-2">
                    {deleteSearchResults.map(course => (
                      <div key={course.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-red-50 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{course.course_name}</p>
                          <p className="text-xs text-slate-500">{course.course_number}</p>
                        </div>
                        <button onClick={() => handleDeleteCourse(course.id, course.course_name)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-100 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {deleteSearchQuery.length >= 2 && deleteSearchResults.length === 0 && (
                      <p className="text-center text-slate-400 text-sm py-4">לא נמצאו קורסים</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="mr-16 flex flex-col flex-1 min-h-screen overflow-hidden">

        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between flex-shrink-0 z-30">
          {/* Left side in RTL = visually right: title + logout + bell */}
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-slate-800 whitespace-nowrap">הקורסים שלי</h1>
            <div className="w-px h-5 bg-gray-200" />
            <button onClick={handleLogout} title="התנתק"
              className="text-slate-400 hover:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <NotificationBell />
          </div>

          {/* Center: search */}
          <div className="flex-1 max-w-sm mx-6 relative search-container">
            <div className="relative">
              <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={searchQuery} onChange={e => handleSearchChange(e.target.value)}
                placeholder="חפש קורסים..."
                className="w-full pr-9 pl-4 py-2 text-sm bg-gray-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
            </div>
            {showSearchResults && searchQuery.length >= 3 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map(course => {
                      const isEnrolled = myCourses.some(c => c.courseId === course.id.toString())
                      return (
                        <div key={course.id} className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between">
                          <div className="flex-1 cursor-pointer" onClick={() => goToCourse(course.id.toString(), course)}>
                            <p className="font-semibold text-slate-800 text-sm">{course.course_name}</p>
                            <p className="text-xs text-slate-500">{course.course_number}</p>
                          </div>
                          {isEnrolled
                            ? <span className="text-xs text-green-600 font-medium">✓ רשום</span>
                            : <button onClick={e => { e.stopPropagation(); addCourseFromHeader(course) }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">+ הוסף</button>
                          }
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="px-4 py-6 text-center text-sm text-slate-400">לא נמצאו קורסים</p>
                )}
              </div>
            )}
          </div>

          {/* Right: semester label only */}
          <span className="text-sm text-slate-500 bg-gray-100 px-3 py-1.5 rounded-lg whitespace-nowrap">{getSemesterLabel()}</span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* Add course button (top right) */}
          <div className="flex items-center justify-end mb-6">
            <button onClick={() => setShowEnrollModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              הוסף קורס
            </button>
          </div>

          {/* Greeting */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-800">שלום, {firstName} 👋</h2>
            <p className="text-slate-500 mt-1">ברוכים השבים · הסמסטר בעיצומו</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">פעיל</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{myCourses.filter(c => c.lookingForPartner).length}</p>
              <p className="text-sm text-slate-500 mt-0.5">שותפי למידה</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">סה"כ</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{uploadsCount}</p>
              <p className="text-sm text-slate-500 mt-0.5">קבצים שהעלית</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">סה"כ</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{downloadsCount}</p>
              <p className="text-sm text-slate-500 mt-0.5">הורדות שקיבלת</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">פעיל</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{myCourses.length}</p>
              <p className="text-sm text-slate-500 mt-0.5">קורסים פעילים</p>
            </div>
          </div>

          {/* Section header - title on RIGHT (first in DOM = right in RTL flex) */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">הקורסים שלי</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium" onClick={() => router.push('/courses')}>
              הצג הכל
            </button>
          </div>

          {isLoading && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">טוען קורסים...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && myCourses.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">עדיין לא הוספת קורסים</h3>
              <button onClick={() => setShowEnrollModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                הוסף קורס
              </button>
            </div>
          )}

          {!isLoading && !error && myCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              {myCourses.map((course, index) => {
                const color = COURSE_COLORS[index % COURSE_COLORS.length]
                const icon = COURSE_ICONS[index % COURSE_ICONS.length]
                return (
                  <div key={course.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group relative"
                    onClick={() => goToCourse(course.courseId)}>
                    <div className={`h-1.5 w-full ${color.stripe}`} />
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.iconBg} ${color.iconColor}`}>
                          {icon}
                        </div>
                        <div className="menu-container relative" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === course.id ? null : course.id) }}
                            className="text-gray-300 hover:text-gray-500 p-1 rounded-lg hover:bg-gray-50 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {openMenuId === course.id && (
                            <div className="absolute left-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-36 z-30">
                              <button onClick={() => removeCourse(course.id, course.courseId)}
                                className="w-full px-3 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                הסר קורס
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mb-1">{course.courseNumber}</p>
                      <h4 className="font-bold text-slate-800 text-base leading-snug mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {course.name}
                      </h4>

                      <div className="pt-3 border-t border-gray-50">
                        <label className="flex items-center gap-2 cursor-pointer"
                          onClick={e => { e.stopPropagation(); toggleLookingForPartner(course.id) }}>
                          <div className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${course.lookingForPartner ? 'bg-blue-500' : 'bg-gray-200'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${course.lookingForPartner ? 'left-4' : 'left-0.5'}`} />
                          </div>
                          <span className="text-xs text-slate-400">מחפש שותף ללימוד</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Add card */}
              <div onClick={() => setShowEnrollModal(true)}
                className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all min-h-[160px] group">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 group-hover:border-blue-400 flex items-center justify-center mb-3 transition-colors">
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400 group-hover:text-blue-600 font-medium transition-colors">הוסף קורס</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===== ENROLL MODAL ===== */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowEnrollModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-slate-800">הוספת קורס</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">חפש קורס לפי שם או מספר קורס</p>

            <div className="relative mb-3">
              <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input autoFocus type="text" value={enrollQuery} onChange={e => handleEnrollSearch(e.target.value)}
                placeholder="לדוגמה: מבוא למדעי המחשב או 83210..."
                className="w-full pr-9 pl-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>

            <div className="max-h-72 overflow-y-auto">
              {isEnrollSearching && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              )}
              {!isEnrollSearching && enrollResults.length > 0 && (
                <div className="space-y-2">
                  {enrollResults.map(course => {
                    const isEnrolled = myCourses.some(c => c.courseId === course.id.toString())
                    return (
                      <div key={course.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isEnrolled ? 'border-green-100 bg-green-50' : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer'}`}
                        onClick={() => !isEnrolled && addCourse(course)}>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-sm">{course.course_name}</p>
                          <p className="text-xs text-slate-500">{course.course_number}{course.department ? ` · ${course.department}` : ''}</p>
                        </div>
                        {isEnrolled ? (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1 flex-shrink-0">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            רשום
                          </span>
                        ) : (
                          <button disabled={enrollingId === course.id}
                            className="text-xs text-blue-600 hover:text-white hover:bg-blue-600 font-medium px-3 py-1 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors flex-shrink-0 disabled:opacity-50">
                            {enrollingId === course.id ? '...' : '+ הוסף'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {!isEnrollSearching && enrollQuery.length >= 2 && enrollResults.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-8">לא נמצאו קורסים עבור &quot;{enrollQuery}&quot;</p>
              )}
              {enrollQuery.length < 2 && (
                <p className="text-center text-slate-300 text-sm py-8">הקלד לפחות 2 תווים לחיפוש</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
