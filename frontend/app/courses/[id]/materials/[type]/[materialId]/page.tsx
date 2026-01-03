'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { coursesAPI, authAPI, discussionsAPI, usersAPI } from '@/lib/api'

/**
 * Material View Page Component
 * עמוד הצגת חומר לימוד ספציפי
 */
export default function MaterialViewPage({
  params,
}: {
  params: Promise<{ id: string; type: string; materialId: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const courseId = resolvedParams.id
  const materialType = resolvedParams.type
  const materialId = resolvedParams.materialId
  const discussionRef = useRef<HTMLDivElement>(null)

  // State management
  const [material, setMaterial] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<any[]>([])
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [discussion, setDiscussion] = useState<any>(null)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  /**
   * Fetch material data on mount
   */
  useEffect(() => {
    const fetchMaterialData = async () => {
      try {
        if (!authAPI.isAuthenticated()) {
          router.push('/login')
          return
        }

        // Fetch material data and current user in parallel
        const [materialData, userData] = await Promise.all([
          coursesAPI.getMaterialById(materialId),
          usersAPI.getCurrentUser()
        ])

        setMaterial(materialData)
        setCurrentUser(userData)

        setIsLoading(false)

        // Load discussion and comments for this material
        loadDiscussionAndComments()
      } catch (err) {
        console.error('Error fetching material:', err)
        setError('שגיאה בטעינת החומר')
        setIsLoading(false)
      }
    }

    fetchMaterialData()
  }, [materialId, router])

  /**
   * Load discussion and comments for the material
   */
  const loadDiscussionAndComments = async () => {
    try {
      setIsLoadingComments(true)

      // Get discussion for this material (automatically created by backend)
      const discussionData = await discussionsAPI.getMaterialDiscussion(materialId)
      setDiscussion(discussionData)

      // Load comments for the discussion
      const commentsData = await discussionsAPI.getDiscussionComments(discussionData.id)
      setComments(Array.isArray(commentsData) ? commentsData : [])

      setIsLoadingComments(false)
    } catch (err) {
      console.error('Error loading discussion:', err)
      setIsLoadingComments(false)
    }
  }

  /**
   * Load file preview when material data is available
   */
  useEffect(() => {
    let objectUrl: string | null = null

    const loadFilePreview = async () => {
      if (!material || !material.file_name) {
        // If there's no file, set an appropriate error message
        if (material && !material.file_name) {
          setPreviewError('לא קיים קובץ מצורף לחומר זה')
        }
        return
      }

      setIsLoadingPreview(true)
      setPreviewError(null)

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        // Fetch the file as blob
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/materials/${materialId}/download`, {
          method: 'GET',
          headers,
        })

        if (!response.ok) {
          if (response.status === 404) {
            setPreviewError('הקובץ לא נמצא בשרת. ייתכן שהוא לא הועלה עדיין.')
          } else {
            setPreviewError('שגיאה בטעינת הקובץ')
          }
          setIsLoadingPreview(false)
          return
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        objectUrl = url
        setFilePreviewUrl(url)
        setIsLoadingPreview(false)
      } catch (err) {
        console.error('Error loading file preview:', err)
        setPreviewError('שגיאה בטעינת תצוגה מקדימה')
        setIsLoadingPreview(false)
      }
    }

    loadFilePreview()

    // Cleanup: revoke object URL when component unmounts or material changes
    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl)
      }
    }
  }, [material, materialId])

  /**
   * Handle logout
   */
  const handleLogout = () => {
    authAPI.logout()
    router.push('/login')
  }

  /**
   * Go back to materials page
   */
  const goBack = () => {
    router.push(`/courses/${courseId}/materials/${materialType}`)
  }

  /**
   * Navigate to profile
   */
  const goToProfile = () => {
    router.push('/profile')
  }

  /**
   * Handle material download
   */
  const handleDownload = async () => {
    try {
      await coursesAPI.downloadMaterial(parseInt(materialId), material.file_name || material.title)
      // Refresh material data to update download count
      // TODO: Implement refresh
    } catch (err) {
      console.error('Error downloading file:', err)
      alert('שגיאה בהורדת הקובץ')
    }
  }

  /**
   * Handle rating
   */
  const handleRating = async (rating: number) => {
    setUserRating(rating)
    // TODO: Send rating to backend
    console.log('Rating:', rating)
  }

  /**
   * Scroll to discussion section
   */
  const scrollToDiscussion = () => {
    discussionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  /**
   * Handle comment submission
   */
  const handleCommentSubmit = async () => {
    if (!comment.trim() || !discussion) return

    try {
      // Send comment to backend
      await discussionsAPI.createComment(discussion.id, comment)

      // Clear input
      setComment('')

      // Reload comments
      await loadDiscussionAndComments()
    } catch (err) {
      console.error('Error creating comment:', err)
      alert('שגיאה בשליחת התגובה')
    }
  }

  /**
   * Handle reply submission
   */
  const handleReplySubmit = async (commentId: number) => {
    if (!replyText.trim() || !discussion) return

    try {
      // Check if user is authenticated
      if (!authAPI.isAuthenticated()) {
        alert('נדרש להתחבר מחדש')
        router.push('/login')
        return
      }

      // Send reply to backend (as a comment with parent_comment_id)
      await discussionsAPI.createComment(discussion.id, replyText, commentId)

      // Clear input
      setReplyText('')
      setReplyTo(null)

      // Reload comments
      await loadDiscussionAndComments()
    } catch (err) {
      console.error('Error creating reply:', err)
      const errorMessage = err instanceof Error ? err.message : ''

      if (errorMessage.includes('Could not validate credentials') || errorMessage.includes('Unauthorized')) {
        alert('⚠️ הפג תוקף ההתחברות\n\nאנא התחבר מחדש כדי להמשיך.')
        router.push('/login')
      } else {
        alert('שגיאה בשליחת התשובה: ' + errorMessage)
      }
    }
  }

  /**
   * Handle comment deletion
   */
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התגובה?')) return

    try {
      await discussionsAPI.deleteComment(commentId)
      // Reload comments
      await loadDiscussionAndComments()
    } catch (err) {
      console.error('Error deleting comment:', err)
      alert('שגיאה במחיקת התגובה')
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
          <p className="mt-4 text-secondary-600">טוען חומר...</p>
        </div>
      </div>
    )
  }

  if (error || !material) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'חומר לא נמצא'}</p>
          <button
            onClick={goBack}
            className="mt-4 btn-primary px-6 py-2"
          >
            חזרה לרשימת החומרים
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
                title="חזור לחומרים"
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
        <div className="flex gap-6">
          {/* Right Sidebar - Ask AI */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-24">
              <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>שאל את ה-AI</span>
              </button>
            </div>
          </div>

          {/* Center - Material Content */}
          <div className="flex-1 max-w-4xl">
            {/* Material Header */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <h1 className="text-4xl font-bold text-secondary-900 mb-4">
                {material.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-secondary-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {material.uploader_full_name || material.uploader_username || `משתמש #${material.uploader_id}`}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(material.created_at).toLocaleDateString('he-IL')}
                </span>
              </div>
            </div>

            {/* Material Content - File Preview */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              {material.description && (
                <div className="mb-6 pb-6 border-b border-secondary-200">
                  <h3 className="text-lg font-bold text-secondary-900 mb-2">תיאור:</h3>
                  <p className="text-secondary-800 leading-relaxed">{material.description}</p>
                </div>
              )}

              {/* File Preview */}
              {material.file_name ? (
                <div>
                  <h3 className="text-lg font-bold text-secondary-900 mb-4">תצוגה מקדימה:</h3>

                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center py-20 bg-secondary-50 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-secondary-600">טוען את הקובץ...</p>
                      </div>
                    </div>
                  ) : previewError ? (
                    <div className="bg-yellow-50 rounded-lg p-8 border-2 border-yellow-200 text-center">
                      <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="font-bold text-yellow-900 mb-2">{previewError}</p>
                      <p className="text-sm text-yellow-700 mb-4">
                        {material.file_name}
                      </p>
                      <p className="text-sm text-yellow-600">
                        אם העלית קובץ זה לאחרונה, ייתכן שהוא עדיין בתהליך עיבוד.
                      </p>
                    </div>
                  ) : filePreviewUrl ? (
                    <div className="border border-secondary-200 rounded-lg overflow-hidden bg-secondary-50">
                      <iframe
                        src={filePreviewUrl}
                        className="w-full"
                        style={{ height: '800px' }}
                        title="תצוגה מקדימה של הקובץ"
                      />
                    </div>
                  ) : (
                    <div className="bg-secondary-50 rounded-lg p-8 border border-secondary-200 text-center">
                      <svg className="w-16 h-16 text-secondary-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="font-medium text-secondary-900 mb-2">{material.file_name}</p>
                      {material.file_size && (
                        <p className="text-sm text-secondary-600 mb-4">
                          גודל: {(material.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                      <p className="text-sm text-secondary-600">
                        לחץ על כפתור ההורדה בצד השמאלי כדי להוריד את הקובץ
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 rounded-lg p-8 border border-blue-200 text-center">
                  <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium text-blue-900 mb-2">לא קיים קובץ מצורף לחומר זה</p>
                  <p className="text-sm text-blue-600">
                    ייתכן שמדובר בקישור חיצוני או בחומר טקסטואלי בלבד
                  </p>
                </div>
              )}

              {material.external_url && (
                <div className="mt-6">
                  <a
                    href={material.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    קישור חיצוני לחומר
                  </a>
                </div>
              )}
            </div>

            {/* Discussion Section */}
            <div ref={discussionRef} className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-secondary-900 mb-6">
                דיון על הסיכום
              </h2>

              {/* Add Comment */}
              <div className="mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="הוסף תגובה..."
                  rows={4}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <button
                  onClick={handleCommentSubmit}
                  disabled={!comment.trim()}
                  className="mt-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 text-white rounded-lg transition-colors"
                >
                  פרסם תגובה
                </button>
              </div>

              {/* Comments List */}
              {isLoadingComments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-secondary-600">טוען תגובות...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map((commentItem) => (
                  <div key={commentItem.id} className="border-r-4 border-primary-200 pr-4">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-700 font-bold">
                          {(commentItem.author_full_name || commentItem.author_username || 'א').charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-secondary-900">
                            {commentItem.author_full_name || commentItem.author_username || 'משתמש'}
                          </span>
                          <span className="text-xs text-secondary-500">
                            {new Date(commentItem.created_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                        <p className="text-secondary-700">{commentItem.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => setReplyTo(commentItem.id)}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            הגב
                          </button>
                          {currentUser?.id === commentItem.author_id && (
                            <button
                              onClick={() => handleDeleteComment(commentItem.id)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              מחק
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reply Form */}
                    {replyTo === commentItem.id && (
                      <div className="mr-13 mt-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="כתוב תשובה..."
                          rows={2}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleReplySubmit(commentItem.id)}
                            disabled={!replyText.trim()}
                            className="px-4 py-1 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 text-white rounded-lg transition-colors text-sm"
                          >
                            פרסם
                          </button>
                          <button
                            onClick={() => {
                              setReplyTo(null)
                              setReplyText('')
                            }}
                            className="px-4 py-1 bg-secondary-300 hover:bg-secondary-400 text-secondary-700 rounded-lg transition-colors text-sm"
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {commentItem.replies?.length > 0 && (
                      <div className="mr-13 mt-4 space-y-3">
                        {commentItem.replies.map((reply: any) => (
                          <div key={reply.id} className="flex items-start gap-2">
                            <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-secondary-700 font-bold text-sm">
                                {(reply.author_full_name || reply.author_username || 'א').charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-secondary-900 text-sm">
                                  {reply.author_full_name || reply.author_username || 'משתמש'}
                                </span>
                                <span className="text-xs text-secondary-500">
                                  {new Date(reply.created_at).toLocaleDateString('he-IL')}
                                </span>
                                {currentUser?.id === reply.author_id && (
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-xs text-red-600 hover:text-red-700 mr-auto"
                                  >
                                    מחק
                                  </button>
                                )}
                              </div>
                              <p className="text-secondary-700 text-sm">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  ))}

                  {comments.length === 0 && (
                    <div className="text-center py-8 text-secondary-500">
                      <p>אין תגובות עדיין. היה הראשון להגיב!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Left Sidebar - Download & Rating */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Download Button */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <button
                  onClick={handleDownload}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  הורד סיכום
                </button>
                <div className="mt-3 text-center">
                  <p className="text-sm text-secondary-600">
                    <span className="font-bold text-primary-600">{material.download_count}</span> הורדות
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="font-bold text-secondary-900 mb-3 text-center">דרג את הסיכום</h3>
                <div className="flex justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all transform hover:scale-125"
                    >
                      <svg
                        className={`w-8 h-8 ${
                          star <= (hoverRating || userRating)
                            ? 'text-yellow-500 fill-current'
                            : 'text-secondary-300'
                        }`}
                        fill={star <= (hoverRating || userRating) ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
                <div className="text-center text-sm">
                  <p className="text-secondary-600">
                    ממוצע: <span className="font-bold text-yellow-600">{material.average_rating.toFixed(1)}</span>
                  </p>
                  <p className="text-xs text-secondary-500">({material.rating_count} דירוגים)</p>
                </div>
              </div>

              {/* Jump to Discussion */}
              <button
                onClick={scrollToDiscussion}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                לדיון על הסיכום
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
