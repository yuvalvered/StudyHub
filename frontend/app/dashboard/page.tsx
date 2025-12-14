'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { authAPI, usersAPI } from '@/lib/api'

/**
 * Dashboard Page Component
 * עמוד הבית של המשתמש המחובר - הקורסים שלי
 * נמצא ב: /dashboard
 *
 * Features:
 * - Display user's courses in grid layout
 * - Search for new courses by name or number
 * - Add/Remove courses from user's list
 * - Mark "looking for study partner" for each course
 * - Logout and profile navigation
 * - Full RTL support for Hebrew
 */

// Mock course data - will be replaced with API call
interface Course {
  id: string
  name: string
  courseNumber: string
  lookingForPartner: boolean
}

export default function DashboardPage() {
  const router = useRouter()

  // State for user's courses
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  /**
   * Fetch user's courses on mount
   */
  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        // Check if user is authenticated
        if (!authAPI.isAuthenticated()) {
          router.push('/login')
          return
        }

        // Fetch user's enrolled courses
        const courses: any = await usersAPI.getMyCourses()

        // Transform backend data to frontend format
        const transformedCourses = courses.map((course: any) => ({
          id: course.course_id.toString(),
          name: course.course_name,
          courseNumber: course.course_number,
          lookingForPartner: course.looking_for_study_partner
        }))

        setMyCourses(transformedCourses)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching courses:', err)
        setError('שגיאה בטעינת הקורסים')
        setIsLoading(false)
      }
    }

    fetchMyCourses()
  }, [router])

  /**
   * Handle logout
   * התנתקות מהמערכת
   */
  const handleLogout = () => {
    authAPI.logout()
    router.push('/login')
  }

  /**
   * Navigate to profile
   * מעבר לפרופיל אישי
   */
  const goToProfile = () => {
    router.push('/profile')
  }

  /**
   * Handle course search
   * חיפוש קורס
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual search API call
    setShowSearchResults(true)
    console.log('Searching for:', searchQuery)
  }

  /**
   * Add course to my courses
   * הוספת קורס לקורסים שלי
   */
  const addCourse = (course: Course) => {
    setMyCourses([...myCourses, course])
    setSearchQuery('')
    setShowSearchResults(false)
  }

  /**
   * Remove course from my courses
   * הסרת קורס מהקורסים שלי
   */
  const removeCourse = (courseId: string) => {
    setMyCourses(myCourses.filter(c => c.id !== courseId))
    setOpenMenuId(null)
  }

  /**
   * Toggle looking for study partner
   * החלפת מצב חיפוש שותף לימוד
   */
  const toggleLookingForPartner = (courseId: string) => {
    setMyCourses(myCourses.map(course =>
      course.id === courseId
        ? { ...course, lookingForPartner: !course.lookingForPartner }
        : course
    ))
  }

  /**
   * Toggle course menu
   * פתיחה/סגירה של תפריט קורס
   */
  const toggleMenu = (courseId: string) => {
    setOpenMenuId(openMenuId === courseId ? null : courseId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-primary-700 shadow-md z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Right side - Logo */}
            <Logo size="md" variant="light" />

            {/* Center - Search Bar */}
            <div className="flex-1 max-w-xl mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש קורס לפי שם או מספר..."
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Left side - Profile & Logout */}
            <div className="flex items-center gap-4">
              <button
                onClick={goToProfile}
                className="text-white/90 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium">פרופיל אישי</span>
              </button>

              <button
                onClick={handleLogout}
                className="text-white/90 hover:text-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5"  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">התנתק</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">הקורסים שלי</h1>
            <p className="text-secondary-600">ניהול הקורסים שאתה לומד השנה</p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">טוען קורסים...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && myCourses.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-secondary-900 mb-2">עדיין לא הוספת קורסים</h2>
                <p className="text-secondary-600 mb-6">התחל בחיפוש קורסים והוסף אותם לרשימה שלך</p>
                <button
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()}
                  className="btn-primary px-6 py-3 font-medium"
                >
                  חפש קורס להוספה
                </button>
              </div>
            </div>
          )}

          {/* Courses Grid */}
          {!isLoading && !error && myCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {myCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 relative">
                  {/* Course Menu (3 dots) */}
                  <div className="absolute top-4 left-4">
                    <button
                      onClick={() => toggleMenu(course.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === course.id && (
                      <div className="absolute left-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-10">
                        <button
                          onClick={() => removeCourse(course.id)}
                          className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          מחק קורס
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Course Info - Centered */}
                  <div className="text-center pt-6">
                    <h3 className="text-2xl font-bold text-secondary-900 mb-2">{course.name}</h3>
                    <p className="text-base text-secondary-600 mb-6">{course.courseNumber}</p>
                  </div>

                  {/* Looking for Partner Toggle */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={course.lookingForPartner}
                        onChange={() => toggleLookingForPartner(course.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-secondary-700">מחפש שותף ללימוד</span>
                    </label>

                    {course.lookingForPartner && (
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Course Button */}
          {myCourses.length > 0 && (
            <div className="text-center">
              <button
                onClick={() => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()}
                className="btn-primary px-8 py-3 font-medium inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                הוסף קורס נוסף
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
