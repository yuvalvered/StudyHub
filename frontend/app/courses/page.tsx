'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { coursesAPI, usersAPI, authAPI } from '@/lib/api'
import NotificationBell from '@/components/NotificationBell'

const DEPT_COLORS: Record<string, { stripe: string; icon: string }> = {
  'מדעי המחשב':    { stripe: 'bg-blue-500',   icon: 'bg-blue-100 text-blue-600' },
  'הנדסת תוכנה':   { stripe: 'bg-indigo-500', icon: 'bg-indigo-100 text-indigo-600' },
  'מתמטיקה':       { stripe: 'bg-purple-500', icon: 'bg-purple-100 text-purple-600' },
  'פיזיקה':         { stripe: 'bg-cyan-500',   icon: 'bg-cyan-100 text-cyan-600' },
  'כימיה':          { stripe: 'bg-green-500',  icon: 'bg-green-100 text-green-600' },
  'הנדסה':          { stripe: 'bg-orange-500', icon: 'bg-orange-100 text-orange-600' },
  'ביולוגיה':       { stripe: 'bg-teal-500',   icon: 'bg-teal-100 text-teal-600' },
  'כלכלה':          { stripe: 'bg-yellow-500', icon: 'bg-yellow-100 text-yellow-600' },
}

const DEFAULT_COLOR = { stripe: 'bg-slate-400', icon: 'bg-slate-100 text-slate-600' }

function getCourseColor(department?: string) {
  if (!department) return DEFAULT_COLOR
  for (const [key, val] of Object.entries(DEPT_COLORS)) {
    if (department.includes(key)) return val
  }
  const colors = Object.values(DEPT_COLORS)
  const idx = (department.charCodeAt(0) || 0) % colors.length
  return colors[idx]
}

export default function CoursesPage() {
  const router = useRouter()

  const [courses, setCourses] = useState<any[]>([])
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const [myCourseIds, setMyCourseIds] = useState<Set<number>>(new Set())
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [enrollingId, setEnrollingId] = useState<number | null>(null)
  const [unenrollingId, setUnenrollingId] = useState<number | null>(null)
  const [profileImgError, setProfileImgError] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState<string>('הכל')
  const [departments, setDepartments] = useState<string[]>([])

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authAPI.isAuthenticated()) { router.push('/login'); return }
    const load = async () => {
      try {
        const [allCourses, userData, myCourses] = await Promise.all([
          coursesAPI.getAllCourses(),
          usersAPI.getCurrentUser(),
          usersAPI.getMyCourses(),
        ])
        const courseList = Array.isArray(allCourses) ? allCourses : (allCourses?.courses ?? [])
        setCourses(courseList)
        setFilteredCourses(courseList)
        setCurrentUser(userData)
        const ids = new Set<number>((Array.isArray(myCourses) ? myCourses : []).map((c: any) => Number(c.course_id || c.courseId || c.id)))
        setMyCourseIds(ids)
        const depts = Array.from(new Set<string>(courseList.map((c: any) => c.department).filter(Boolean)))
        setDepartments(depts as string[])
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let result = courses
    if (selectedDept !== 'הכל') result = result.filter(c => c.department === selectedDept)
    const q = searchQuery.trim().toLowerCase()
    if (q) result = result.filter(c =>
      c.course_name?.toLowerCase().includes(q) || c.course_number?.toLowerCase().includes(q)
    )
    setFilteredCourses(result)
  }, [searchQuery, selectedDept, courses])

  const handleEnroll = async (courseId: number) => {
    setEnrollingId(courseId)
    try {
      await usersAPI.enrollInCourse(courseId)
      setMyCourseIds(prev => new Set([...prev, courseId]))
    } catch (err: any) {
      if (err.message?.includes('already enrolled')) {
        setMyCourseIds(prev => new Set([...prev, courseId]))
      }
    } finally {
      setEnrollingId(null)
    }
  }

  const handleUnenroll = async (courseId: number) => {
    if (!confirm('האם לבטל את ההרשמה לקורס זה?')) return
    setUnenrollingId(courseId)
    try {
      await usersAPI.unenrollFromCourse(courseId)
      setMyCourseIds(prev => { const s = new Set(prev); s.delete(courseId); return s })
    } catch (err) {
      console.error(err)
    } finally {
      setUnenrollingId(null)
    }
  }

  const firstName = currentUser?.full_name?.split(' ')[0] || currentUser?.username || ''

  return (
    <div dir="rtl" className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ===== SIDEBAR ===== */}
      <aside className="fixed right-0 top-0 h-full w-16 bg-slate-900 flex flex-col items-center py-5 z-50 gap-1">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-4 flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <button onClick={() => router.push('/dashboard')} title="הקורסים שלי"
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>

          <button onClick={() => router.push('/courses')} title="כל הקורסים"
            className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
        </nav>

        <button onClick={() => router.push('/profile')} title="פרופיל אישי"
          className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center relative mt-auto flex-shrink-0">
          {currentUser?.profile_image_url && !profileImgError ? (
            <img
              src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '')}/${currentUser.profile_image_url}`}
              alt="פרופיל"
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

      {/* ===== MAIN ===== */}
      <div className="flex-1 mr-16 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 z-10">
          {/* Title - RIGHT */}
          <div className="text-right">
            <h1 className="text-lg font-bold text-slate-800">כל הקורסים</h1>
            <p className="text-xs text-slate-400">{filteredCourses.length} קורסים</p>
          </div>

          {/* Search - CENTER */}
          <div className="flex-1 max-w-lg mx-6">
            <div className="relative">
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="חפש לפי שם קורס או מספר..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 rounded-xl py-2 pr-9 pl-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Notification - LEFT */}
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* DEPT FILTER */}
        <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {['הכל', ...departments].map(dept => (
            <button key={dept} onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedDept === dept
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }`}>
              {dept}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">לא נמצאו קורסים</p>
              <p className="text-slate-400 text-sm">נסה לשנות את החיפוש או הפילטר</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCourses.map(course => {
                const color = getCourseColor(course.department)
                const isEnrolled = myCourseIds.has(Number(course.id))
                const isEnrolling = enrollingId === course.id

                const isUnenrolling = unenrollingId === course.id

                return (
                  <div key={course.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => router.push(`/courses/${course.id}`)}>

                    {/* Top stripe */}
                    <div className={`h-1.5 w-full ${color.stripe}`} />

                    <div className="p-4 flex flex-col flex-1">
                      {/* Icon + number */}
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs text-slate-400 font-mono">{course.course_number}</span>
                        <div className={`w-9 h-9 rounded-xl ${color.icon} flex items-center justify-center flex-shrink-0`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      </div>

                      {/* Name */}
                      <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1 flex-1">{course.course_name}</h3>

                      {/* Department */}
                      {course.department && (
                        <p className="text-xs text-slate-400 mb-3">{course.department}</p>
                      )}

                      {/* Description */}
                      {course.description && (
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{course.description}</p>
                      )}

                      {/* Action button */}
                      {isEnrolled ? (
                        <button
                          onClick={e => { e.stopPropagation(); handleUnenroll(course.id) }}
                          disabled={isUnenrolling}
                          className="mt-auto w-full py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100">
                          {isUnenrolling ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              בטל הרשמה
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); handleEnroll(course.id) }}
                          disabled={isEnrolling}
                          className="mt-auto w-full py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 bg-slate-900 text-white hover:bg-slate-700 group-hover:bg-blue-600">
                          {isEnrolling ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              הצטרף לקורס
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
