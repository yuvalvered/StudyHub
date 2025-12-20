'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { coursesAPI, authAPI } from '@/lib/api'

/**
 * Material Categories based on backend MaterialType enum
 * קטגוריות חומרי הלימוד
 */
const MATERIAL_CATEGORIES = [
  { type: 'summaries', label: 'סיכומים', icon: '📄' },
  { type: 'homework', label: 'עבודות בית', icon: '✍️' },
  { type: 'lectures', label: 'הרצאות', icon: '🎓' },
  { type: 'exercises', label: 'תרגולים', icon: '📝' },
  { type: 'exam_prep', label: 'הכנה למבחן', icon: '📚' },
  { type: 'quiz_prep', label: 'הכנה לבוחן', icon: '📖' },
  { type: 'quizme', label: 'QuizMe', icon: '🎯' },
]

/**
 * Course Details Page Component
 * עמוד פרטי קורס ספציפי
 */
export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const courseId = resolvedParams.id

  // State management
  const [course, setCourse] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [studyPartners, setStudyPartners] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStudyPartners, setShowStudyPartners] = useState(false)

  /**
   * Fetch course data on mount
   */
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Check authentication
        if (!authAPI.isAuthenticated()) {
          router.push('/login')
          return
        }

        // Fetch course details and materials
        const [courseData, materialsData] = await Promise.all([
          coursesAPI.getCourseById(courseId),
          coursesAPI.getCourseMaterials(courseId)
        ])

        setCourse(courseData)
        setMaterials(Array.isArray(materialsData) ? materialsData : [])
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching course data:', err)
        setError('שגיאה בטעינת נתוני הקורס')
        setIsLoading(false)
      }
    }

    fetchCourseData()
  }, [courseId, router])

  /**
   * Handle logout
   */
  const handleLogout = () => {
    authAPI.logout()
    router.push('/login')
  }

  /**
   * Go back to courses page
   */
  const goBack = () => {
    router.push('/dashboard')
  }

  /**
   * Go to profile
   */
  const goToProfile = () => {
    router.push('/profile')
  }

  /**
   * Load study partners
   * טעינת שותפי למידה
   */
  const loadStudyPartners = async () => {
    try {
      const partners = await coursesAPI.getStudyPartners(courseId)
      setStudyPartners(Array.isArray(partners) ? partners : [])
      setShowStudyPartners(true)
    } catch (err: any) {
      console.error('Error loading study partners:', err)
      // If backend returns 501 (not implemented), show empty list
      // כאשר הבקאנד מחזיר 501, נציג רשימה ריקה
      if (err.message?.includes('501') || err.message?.includes('not implemented')) {
        setStudyPartners([])
        setShowStudyPartners(true)
      } else {
        alert('שגיאה בטעינת שותפי למידה')
      }
    }
  }

  /**
   * Get materials count by type
   */
  const getMaterialsCount = (type: string) => {
    return materials.filter(m => m.material_type === type).length
  }

  /**
   * Navigate to category page
   */
  const handleCategoryClick = (categoryType: string) => {
    // Navigate to the category-specific page
    router.push(`/courses/${courseId}/materials/${categoryType}`)
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
          <p className="mt-4 text-secondary-600">טוען נתוני קורס...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'קורס לא נמצא'}</p>
          <button
            onClick={goBack}
            className="mt-4 btn-primary px-6 py-2"
          >
            חזרה לקורסים
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-primary-700 shadow-md z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Right side - Logo */}
            <Logo size="md" variant="light" />

            {/* Left side - Navigation Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="text-white/90 hover:text-white transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-600"
                title="חזור לקורסים"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">חזור</span>
              </button>

              <button
                onClick={goToProfile}
                className="text-white/90 hover:text-white transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-600"
                title="הפרופיל שלי"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium">הפרופיל שלי</span>
              </button>

              <button
                onClick={handleLogout}
                className="text-white/90 hover:text-red-400 transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-600"
                title="התנתק"
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
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Course Title */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-secondary-900 mb-2">
              {course.course_name}
            </h1>
            <p className="text-xl text-secondary-600">
              קורס מספר: {course.course_number}
            </p>
            {course.department && (
              <p className="text-secondary-500 mt-1">
                {course.department}
              </p>
            )}
          </div>

          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1">
              {/* Material Categories Grid */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-secondary-900 mb-6">
                  קטגוריות חומרי לימוד
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MATERIAL_CATEGORIES.map((category) => {
                    const count = getMaterialsCount(category.type)
                    return (
                      <button
                        key={category.type}
                        onClick={() => handleCategoryClick(category.type)}
                        className="rounded-xl p-6 text-center transition-all transform hover:scale-105 border-2 bg-gradient-to-br from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 border-primary-200 hover:border-primary-400"
                      >
                        <div className="text-4xl mb-3">{category.icon}</div>
                        <h3 className="text-lg font-bold mb-2 text-secondary-900">
                          {category.label}
                        </h3>
                        <p className="text-2xl font-bold text-primary-700">
                          {count}
                        </p>
                        <p className="text-xs mt-1 text-secondary-600">חומרים</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Study Partners Sidebar */}
            <div className="w-80">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
                <button
                  onClick={loadStudyPartners}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 mb-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  מחפשי שותפי למידה
                </button>

                {showStudyPartners && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-secondary-900 mb-3">
                      שותפי למידה זמינים
                    </h3>
                    {studyPartners.length > 0 ? (
                      studyPartners.map((partner) => (
                        <div
                          key={partner.id}
                          className="bg-secondary-50 rounded-lg p-3 hover:bg-secondary-100 transition-colors"
                        >
                          <p className="font-medium text-secondary-900">{partner.name}</p>
                          <p className="text-xs text-secondary-600">{partner.email}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-secondary-500 text-sm text-center py-4">
                        אין שותפי למידה רשומים כרגע
                      </p>
                    )}
                  </div>
                )}

                {!showStudyPartners && (
                  <div className="text-center text-secondary-500 text-sm">
                    לחץ על הכפתור לצפייה ברשימה מעודכנת של מי שמחפש שותפי למידה בקורס
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
