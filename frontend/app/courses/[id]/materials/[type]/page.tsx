'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import { coursesAPI, authAPI, usersAPI, searchAPI } from '@/lib/api'

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

const CATEGORY_SINGULAR: Record<string, string> = {
  summaries: 'סיכום',
  homework: 'עבודת בית',
  lectures: 'הרצאה',
  exercises: 'תרגול',
  exam_prep: 'חומר הכנה למבחן',
  quiz_prep: 'חומר הכנה לבוחן',
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
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'downloads' | 'rating'>('newest')
  const [isSearching, setIsSearching] = useState(false)

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

        const [courseData, materialsData, userData] = await Promise.all([
          coursesAPI.getCourseById(courseId),
          coursesAPI.getCourseMaterials(courseId, materialType),
          usersAPI.getCurrentUser(),
        ])

        setCourse(courseData)
        setCurrentUser(userData)
        const materialsArray = Array.isArray(materialsData) ? materialsData : []

        // Fetch uploader information for all materials
        const uniqueUploaderIds = [...new Set(materialsArray.map((m: any) => m.uploader_id))]
        const uploaderPromises = uniqueUploaderIds.map((id: number) =>
          usersAPI.getUserById(id).catch(() => null)
        )
        const uploaders = await Promise.all(uploaderPromises)

        // Create uploader map
        const uploaderMap = new Map()
        uploaders.forEach((uploader: any) => {
          if (uploader) {
            uploaderMap.set(uploader.id, uploader)
          }
        })

        // Merge uploader info into materials
        const materialsWithUploaders = materialsArray.map((material: any) => {
          const uploader = uploaderMap.get(material.uploader_id)
          return {
            ...material,
            uploader_username: uploader?.username,
            uploader_full_name: uploader?.full_name
          }
        })

        setMaterials(materialsWithUploaders)
        setFilteredMaterials(materialsWithUploaders)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [courseId, materialType, router])

  /**
   * Filter and sort materials - uses server-side search API for content search
   */
  useEffect(() => {
    const performSearch = async () => {
      // If no search query, just sort the materials locally
      if (!searchQuery || searchQuery.trim().length === 0) {
        const sorted = [...materials].sort((a, b) => {
          if (sortBy === 'newest') {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          } else if (sortBy === 'downloads') {
            return (b.download_count || 0) - (a.download_count || 0)
          } else if (sortBy === 'rating') {
            return (b.average_rating || 0) - (a.average_rating || 0)
          }
          return 0
        })
        setFilteredMaterials(sorted)
        return
      }

      // Use Search API for content search
      setIsSearching(true)
      try {
        const sortByMap: Record<string, 'relevance' | 'date' | 'rating'> = {
          'newest': 'date',
          'downloads': 'relevance', // No direct mapping, use relevance
          'rating': 'rating'
        }

        const response = await searchAPI.searchMaterials(searchQuery, {
          course_id: parseInt(courseId),
          material_type: materialType,
          sort_by: sortByMap[sortBy] || 'relevance',
          limit: 20
        })

        // Map search results back to material format for display
        // We need to match with our loaded materials to get full data
        const matchedMaterials = response.results
          .map(result => {
            const material = materials.find(m => m.id === result.material_id)
            if (material) {
              return {
                ...material,
                _searchSnippet: result.snippet,
                _matchType: result.match_type
              }
            }
            return null
          })
          .filter(Boolean)

        setFilteredMaterials(matchedMaterials)
      } catch (error) {
        console.error('Search error:', error instanceof Error ? error.message : JSON.stringify(error))
        // Fallback to local search on error
        const query = searchQuery.toLowerCase()
        const filtered = materials.filter(
          (material) =>
            material.title?.toLowerCase().includes(query) ||
            material.description?.toLowerCase().includes(query) ||
            material.uploader_username?.toLowerCase().includes(query) ||
            material.uploader_full_name?.toLowerCase().includes(query)
        )
        setFilteredMaterials(filtered)
      } finally {
        setIsSearching(false)
      }
    }

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(performSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, materials, sortBy, courseId, materialType])

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

      // Fetch uploader information for all materials
      const uniqueUploaderIds = [...new Set(materialsArray.map((m: any) => m.uploader_id))]
      const uploaderPromises = uniqueUploaderIds.map((id: number) =>
        usersAPI.getUserById(id).catch(() => null)
      )
      const uploaders = await Promise.all(uploaderPromises)

      // Create uploader map
      const uploaderMap = new Map()
      uploaders.forEach((uploader: any) => {
        if (uploader) {
          uploaderMap.set(uploader.id, uploader)
        }
      })

      // Merge uploader info into materials
      const materialsWithUploaders = materialsArray.map((material: any) => {
        const uploader = uploaderMap.get(material.uploader_id)
        return {
          ...material,
          uploader_username: uploader?.username,
          uploader_full_name: uploader?.full_name
        }
      })

      setMaterials(materialsWithUploaders)
      setFilteredMaterials(materialsWithUploaders)

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

  /**
   * Handle material deletion (admin only)
   * מחיקת חומר לימוד (אדמין בלבד)
   */
  const handleDeleteMaterial = async (materialId: number, materialTitle: string) => {
    // Confirm deletion
    if (!confirm(`האם את בטוחה שברצונך למחוק את "${materialTitle}"?`)) {
      return
    }

    try {
      // Call API to delete material
      await coursesAPI.deleteMaterial(courseId, materialId)

      // Remove from local state
      const updatedMaterials = materials.filter(m => m.id !== materialId)
      setMaterials(updatedMaterials)
      setFilteredMaterials(updatedMaterials)

      alert('החומר נמחק בהצלחה')
    } catch (err) {
      console.error('Error deleting material:', err)
      alert('שגיאה במחיקת החומר')
    }
  }

  if (isLoading) {
    return (
      <div dir="rtl" className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">טוען נתונים...</p>
        </div>
      </div>
    )
  }

  const categoryLabel = CATEGORY_LABELS[materialType] || materialType

  return (
    <div dir="rtl" className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Sidebar */}
      <aside className="fixed right-0 top-0 h-full w-16 bg-slate-900 flex flex-col items-center py-4 z-40">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center mb-6 flex-shrink-0">
          <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <button onClick={goBack} title="חזרה לקורס"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={goToProfile} title="פרופיל"
          className="mt-2 w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        <button onClick={handleLogout} title="התנתק"
          className="mt-auto w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </aside>

      <div className="mr-16 flex flex-col flex-1 min-h-screen overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between flex-shrink-0 gap-4">
          {/* Right: title */}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-800">{categoryLabel}</h1>
            {course && (
              <>
                <div className="w-px h-4 bg-gray-200" />
                <span className="text-sm text-slate-500 whitespace-nowrap">{course.course_name} · {course.course_number}</span>
              </>
            )}
          </div>

          {/* Center: search */}
          <div className="flex-1 max-w-md relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isSearching && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי שם או תוכן..."
              className="w-full pr-9 pl-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-right"
            />
          </div>

          {/* Left: bell */}
          <NotificationBell align="left" />
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* Sort bar */}
          <div className="flex items-center justify-end gap-3 mb-4">
            <span className="text-sm text-slate-500">מיין לפי:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'downloads' | 'rating')}
              className="text-sm px-3 py-2 border border-gray-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="newest">הכי חדש</option>
              <option value="downloads">מספר הורדות</option>
              <option value="rating">דירוג</option>
            </select>
          </div>

          {/* Materials list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
            {filteredMaterials.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {filteredMaterials.map((material) => (
                  <div key={material.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">

                    {/* File icon — clickable */}
                    <div
                      className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => router.push(`/courses/${courseId}/materials/${materialType}/${material.id}`)}
                    >
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>

                    {/* Info — clickable */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => router.push(`/courses/${courseId}/materials/${materialType}/${material.id}`)}
                    >
                      <p className="font-semibold text-slate-800 text-sm truncate">{material.title}</p>
                      {material.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{material.description}</p>
                      )}
                      {material._searchSnippet && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                          <span className="text-xs font-medium text-yellow-700 block mb-1">
                            {material._matchType === 'content' ? 'נמצא בתוכן הקובץ' : material._matchType === 'title' ? 'נמצא בכותרת' : 'נמצא בתיאור'}
                          </span>
                          {material._searchSnippet.split('\n\n').slice(0, 1).map((snippet: string, i: number) => (
                            <p key={i} className="text-xs text-slate-600 border-r-2 border-yellow-300 pr-2"
                              dir="auto"
                              dangerouslySetInnerHTML={{ __html: snippet.replace(/\*\*(.*?)\*\*/g, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>') }}
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {material.uploader_full_name || material.uploader_username || `משתמש #${material.uploader_id}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(material.created_at).toLocaleDateString('he-IL')}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {material.download_count || 0} הורדות
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {material.rating_count || 0} צפיות
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-yellow-500 ml-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-bold text-slate-700">{material.average_rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(material) }}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        הורד
                      </button>
                      {(currentUser?.is_admin || material.uploader_id === currentUser?.id) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(material.id, material.title) }}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-500 text-sm font-medium">
                  {searchQuery ? 'לא נמצאו חומרים התואמים את החיפוש' : 'אין חומרים בקטגוריה זו כרגע'}
                </p>
                <p className="text-slate-400 text-xs mt-1">היה הראשון להעלות חומר!</p>
              </div>
            )}
          </div>

          {/* Upload button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              העלאת תוכן חדש
            </button>
          </div>

        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-bold text-white">העלה {CATEGORY_SINGULAR[materialType] || categoryLabel} חדש</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 text-right">שם החומר <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="לדוגמה: סיכום פרק 3 - אלגוריתמים"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 text-right">תיאור (אופציונלי)</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="הוסף תיאור קצר על החומר..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-none text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 text-right">קובץ PDF <span className="text-red-500">*</span></label>
                <label htmlFor="file-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-slate-400 transition-colors">
                  <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-slate-500">
                    {uploadFile ? <span className="text-slate-800 font-medium">{uploadFile.name}</span> : 'לחץ לבחירת קובץ'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">קבצי PDF בלבד</span>
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="file-upload" />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowUploadModal(false)} disabled={isUploading}
                  className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-slate-600 hover:bg-gray-50 transition-colors">
                  ביטול
                </button>
                <button onClick={handleUpload} disabled={isUploading || !uploadFile || !uploadTitle}
                  className="flex-1 py-2.5 text-sm bg-slate-900 hover:bg-slate-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                  {isUploading ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b border-white" />מעלה...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>העלה קובץ</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
