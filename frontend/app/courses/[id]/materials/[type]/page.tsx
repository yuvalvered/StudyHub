'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { coursesAPI, authAPI } from '@/lib/api'

/**
 * Material Categories Map
 * מיפוי קטגוריות לתצוגה בעברית
 */
const CATEGORY_LABELS: Record<string, string> = {
  summaries: 'סיכומים',
  homework: 'עבודות בית',
  lectures: 'הרצאות',
  exercises: 'תרגולים',
  exam_prep: 'הכנה למבחן',
  quiz_prep: 'הכנה לבוחן',
  quizme: 'QuizMe',
}

/**
 * Material Category Page Component
 * עמוד קטגוריית חומרי לימוד
 */
export default function MaterialCategoryPage({
  params,
}: {
  params: Promise<{ id: string; type: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const courseId = resolvedParams.id
  const materialType = resolvedParams.type

  // State management
  const [course, setCourse] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  /**
   * Fetch course and materials data
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!authAPI.isAuthenticated()) {
          router.push('/login')
          return
        }

        const [courseData, materialsData] = await Promise.all([
          coursesAPI.getCourseById(courseId),
          coursesAPI.getCourseMaterials(courseId, materialType),
        ])

        setCourse(courseData)
        const materialsArray = Array.isArray(materialsData) ? materialsData : []
        setMaterials(materialsArray)
        setFilteredMaterials(materialsArray)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [courseId, materialType, router])

  /**
   * Filter materials by search query
   */
  useEffect(() => {
    if (!searchQuery) {
      setFilteredMaterials(materials)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = materials.filter(
      (material) =>
        material.title?.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query) ||
        material.uploader_username?.toLowerCase().includes(query) ||
        material.uploader_full_name?.toLowerCase().includes(query)
    )
    setFilteredMaterials(filtered)
  }, [searchQuery, materials])

  /**
   * Handle logout
   */
  const handleLogout = () => {
    authAPI.logout()
    router.push('/login')
  }

  /**
   * Navigate to profile
   */
  const goToProfile = () => {
    router.push('/profile')
  }

  /**
   * Go back to course page
   */
  const goBack = () => {
    router.push(`/courses/${courseId}`)
  }

  /**
   * Handle file selection
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setUploadFile(file)
    } else {
      alert('נא לבחור קובץ PDF בלבד')
      e.target.value = ''
    }
  }

  /**
   * Handle upload submission
   */
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle) {
      alert('נא למלא את כל השדות הנדרשים')
      return
    }

    setIsUploading(true)
    try {
      // Create FormData with file and material metadata
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', uploadTitle)
      formData.append('material_type', materialType)
      if (uploadDescription) {
        formData.append('description', uploadDescription)
      }

      // Upload the material to backend
      await coursesAPI.uploadMaterial(courseId, formData)

      // Success - refresh materials list
      const updatedMaterials = await coursesAPI.getCourseMaterials(courseId, materialType)
      const materialsArray = Array.isArray(updatedMaterials) ? updatedMaterials : []
      setMaterials(materialsArray)
      setFilteredMaterials(materialsArray)

      // Reset form and close modal
      setUploadFile(null)
      setUploadTitle('')
      setUploadDescription('')
      setShowUploadModal(false)

      alert('✅ הקובץ הועלה בהצלחה!')
    } catch (err) {
      console.error('Error uploading file:', err)
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה'
      alert(`שגיאה בהעלאת הקובץ: ${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * Handle material download
   */
  const handleDownload = async (material: any) => {
    try {
      await coursesAPI.downloadMaterial(material.id, material.file_name || material.title)

      // Refresh materials list to update download count
      const updatedMaterials = await coursesAPI.getCourseMaterials(courseId, materialType)
      const materialsArray = Array.isArray(updatedMaterials) ? updatedMaterials : []
      setMaterials(materialsArray)
      setFilteredMaterials(materialsArray)
    } catch (err) {
      console.error('Error downloading file:', err)
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה'
      alert(`שגיאה בהורדת הקובץ: ${errorMessage}`)
    }
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

  const categoryLabel = CATEGORY_LABELS[materialType] || materialType

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-primary-700 shadow-md z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Right side - Logo */}
            <Logo size="md" variant="light" />

            {/* Center - Search Bar */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש לפי שם חומר או שם כותב..."
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Left side - Back, Profile & Logout */}
            <div className="flex items-center gap-4">
              <button
                onClick={goBack}
                className="text-white/90 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-sm">חזור</span>
              </button>
              <button
                onClick={goToProfile}
                className="text-white/90 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm">הפרופיל שלי</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-white/90 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="text-sm">התנתקות</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-24 pb-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-secondary-900 mb-2">{categoryLabel}</h1>
          {course && (
            <p className="text-secondary-600">
              {course.course_name} - {course.course_number}
            </p>
          )}
        </div>

        {/* Materials List */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {filteredMaterials.length > 0 ? (
            <div className="space-y-4">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-6 bg-secondary-50 hover:bg-secondary-100 rounded-xl transition-colors border border-secondary-200"
                >
                  {/* Material Icon */}
                  <div
                    className="flex items-center gap-6 flex-1 cursor-pointer"
                    onClick={() => router.push(`/courses/${courseId}/materials/${materialType}/${material.id}`)}
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    {/* Material Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-secondary-900 mb-1">
                        {material.title}
                      </h3>
                      {material.description && (
                        <p className="text-sm text-secondary-600 mb-2">{material.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-secondary-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {material.uploader_full_name || material.uploader_username || `משתמש #${material.uploader_id}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {new Date(material.created_at).toLocaleDateString('he-IL')}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          {material.download_count || 0} הורדות
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {material.rating_count || 0} צפיות
                        </span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-yellow-500 mb-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-bold text-secondary-900">
                          {material.average_rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(material)
                    }}
                    className="mr-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    הורד
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-secondary-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-secondary-600 text-lg">
                {searchQuery
                  ? 'לא נמצאו חומרים התואמים את החיפוש'
                  : 'אין חומרים בקטגוריה זו כרגע'}
              </p>
              <p className="text-secondary-500 text-sm mt-2">
                היה הראשון להעלות חומר בקטגוריה זו!
              </p>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="text-center">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto text-lg font-bold"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          העלאת תוכן חדש 
          </button>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-secondary-900">
                  העלאת {categoryLabel} חדש
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Upload Form */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    שם החומר <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="לדוגמה: סיכום פרק 3 - אלגוריתמים"
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    תיאור (אופציונלי)
                  </label>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="הוסף תיאור קצר על החומר..."
                    rows={4}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    קובץ PDF <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <svg
                        className="w-12 h-12 mx-auto mb-4 text-secondary-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-secondary-600 mb-2">
                        {uploadFile ? (
                          <span className="text-primary-600 font-medium">{uploadFile.name}</span>
                        ) : (
                          'לחץ לבחירת קובץ או גרור לכאן'
                        )}
                      </p>
                      <p className="text-sm text-secondary-500">קבצי PDF בלבד</p>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || !uploadFile || !uploadTitle}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 text-white py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <svg
                          className="animate-spin w-5 h-5"
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
                        מעלה...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        העלה קובץ
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    disabled={isUploading}
                    className="px-6 py-3 border border-secondary-300 text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors font-medium"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
