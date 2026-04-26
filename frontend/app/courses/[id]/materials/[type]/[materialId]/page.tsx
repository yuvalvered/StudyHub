'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import { coursesAPI, authAPI, discussionsAPI, usersAPI, aiAPI } from '@/lib/api'

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
  const aiEndRef = useRef<HTMLDivElement>(null)

  const [material, setMaterial] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [existingRating, setExistingRating] = useState<any>(null)
  const [canRate, setCanRate] = useState(true)
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
  const [hasReported, setHasReported] = useState(false)
  const [canReport, setCanReport] = useState(true)
  const [commentSortBy, setCommentSortBy] = useState<'newest' | 'most_voted'>('newest')
  const [fileExtension, setFileExtension] = useState<string>('')

  // AI panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [aiLoading, setAiLoading] = useState(false)

  // Quiz state
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<{ question: string; options: string[]; correct: number; explanation?: string }[]>([])
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([])
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizNumQuestions, setQuizNumQuestions] = useState(5)

  // Bulb animation - toggles every second
  const [bulbLit, setBulbLit] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setBulbLit(p => !p), 1000)
    return () => clearInterval(t)
  }, [])

  // Scroll AI messages to bottom
  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  useEffect(() => {
    const fetchMaterialData = async () => {
      try {
        if (!authAPI.isAuthenticated()) {
          router.push('/login')
          return
        }
        const [materialData, userData] = await Promise.all([
          coursesAPI.getMaterialById(materialId),
          usersAPI.getCurrentUser()
        ]) as [any, any]
        setMaterial(materialData)
        setCurrentUser(userData)
        // Extract file extension for preview type detection
        if (materialData.file_name) {
          const ext = materialData.file_name.toLowerCase().slice(materialData.file_name.lastIndexOf('.'))
          setFileExtension(ext)
        }
        const userCanRate = materialData.uploader_id !== userData.id
        setCanRate(userCanRate)
        const userCanReport = (materialData as any).uploader_id !== (userData as any).id
        setCanReport(userCanReport)
        if (userCanRate) {
          const userRatingData = await coursesAPI.getUserMaterialRating(parseInt(materialId))
          if (userRatingData) {
            setUserRating(userRatingData.rating)
            setExistingRating(userRatingData)
          }
        }
        setIsLoading(false)
        loadDiscussionAndComments()
      } catch (err) {
        console.error('Error fetching material:', err)
        setError('שגיאה בטעינת החומר')
        setIsLoading(false)
      }
    }
    fetchMaterialData()
  }, [materialId, router])

  const loadDiscussionAndComments = async () => {
    try {
      setIsLoadingComments(true)
      const discussionData = await discussionsAPI.getMaterialDiscussion(materialId) as any
      setDiscussion(discussionData)
      const commentsData = await discussionsAPI.getDiscussionComments(discussionData.id)
      setComments(Array.isArray(commentsData) ? commentsData : [])
      setIsLoadingComments(false)
    } catch (err) {
      console.error('Error loading discussion:', err)
      setIsLoadingComments(false)
    }
  }

  useEffect(() => {
    let objectUrl: string | null = null
    const loadFilePreview = async () => {
      if (!material || !material.file_name) {
        if (material && !material.file_name) setPreviewError('לא קיים קובץ מצורף לחומר זה')
        return
      }

      setIsLoadingPreview(true)
      setPreviewError(null)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        const response = await fetch(`${apiUrl}/materials/${materialId}/preview`, { method: 'GET', headers })
        if (!response.ok) {
          // 501 means Office file preview not available (LibreOffice not installed)
          if (response.status === 501) {
            setPreviewError('תצוגה מקדימה אינה זמינה. הורד את הקובץ לצפייה.')
          } else {
            setPreviewError(response.status === 404 ? 'הקובץ לא נמצא בשרת.' : 'שגיאה בטעינת הקובץ')
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
        setPreviewError('שגיאה בטעינת תצוגה מקדימה')
        setIsLoadingPreview(false)
      }
    }
    loadFilePreview()
    return () => { if (objectUrl) window.URL.revokeObjectURL(objectUrl) }
  }, [material, materialId])

  useEffect(() => {
    if (!isLoadingComments && comments.length > 0) {
      const hash = window.location.hash
      if (hash && hash.startsWith('#comment-')) {
        setTimeout(() => {
          const element = document.querySelector(hash)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('bg-yellow-100', 'ring-2', 'ring-yellow-400', 'rounded-lg')
            setTimeout(() => element.classList.remove('bg-yellow-100', 'ring-2', 'ring-yellow-400'), 2000)
          }
        }, 300)
      }
    }
  }, [isLoadingComments, comments])

  const handleLogout = () => { authAPI.logout(); router.push('/login') }
  const goBack = () => router.push(`/courses/${courseId}/materials/${materialType}`)
  const goToProfile = () => router.push('/profile')

  const handleDownload = async () => {
    try {
      await coursesAPI.downloadMaterial(parseInt(materialId), material.file_name || material.title)
    } catch (err) {
      alert('שגיאה בהורדת הקובץ')
    }
  }

  const handleRating = async (rating: number) => {
    if (!canRate) { alert('אינך יכול לדרג את הסיכומים שלך'); return }
    try {
      if (existingRating) {
        await coursesAPI.updateMaterialRating(parseInt(materialId), rating)
      } else {
        await coursesAPI.rateMaterial(parseInt(materialId), rating)
      }
      setUserRating(rating)
      const updatedMaterial = await coursesAPI.getMaterialById(materialId)
      setMaterial(updatedMaterial)
      const userRatingData = await coursesAPI.getUserMaterialRating(parseInt(materialId))
      if (userRatingData) setExistingRating(userRatingData)
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('already rated')) alert('כבר דירגת סיכום זה. הדירוג עודכן.')
      else alert('שגיאה בדירוג הסיכום')
    }
  }

  const handleReport = async () => {
    if (!canReport) { alert('אינך יכול לדווח על החומר שלך'); return }
    if (hasReported) {
      try {
        await coursesAPI.unreportMaterial(parseInt(materialId))
        setHasReported(false)
        alert('הדיווח בוטל בהצלחה')
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes("haven't reported")) setHasReported(false)
        else alert('שגיאה בביטול הדיווח')
      }
    } else {
      try {
        await coursesAPI.reportMaterial(parseInt(materialId))
        setHasReported(true)
        alert('החומר דווח בהצלחה')
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('already reported')) { setHasReported(true); alert('ניתן לדווח על חומר רק פעם אחת') }
        else alert('שגיאה בדיווח על החומר')
      }
    }
  }

  const scrollToDiscussion = () => discussionRef.current?.scrollIntoView({ behavior: 'smooth' })

  const handleVoteComment = async (commentId: number, voteType: 'upvote' | 'downvote') => {
    try {
      await discussionsAPI.voteComment(commentId, voteType)
      await loadDiscussionAndComments()
    } catch (err) {
      alert('שגיאה בהצבעה על התגובה')
    }
  }

  const getSortedComments = (commentsToSort: any[]): any[] => {
    const sorted = [...commentsToSort]
    if (commentSortBy === 'newest') sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (commentSortBy === 'most_voted') sorted.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    return sorted.map(c => ({ ...c, replies: c.replies ? getSortedComments(c.replies) : [] }))
  }

  const handleCommentSubmit = async () => {
    if (!comment.trim() || !discussion) return
    try {
      await discussionsAPI.createComment(discussion.id, comment)
      setComment('')
      await loadDiscussionAndComments()
    } catch (err) {
      alert('שגיאה בשליחת התגובה')
    }
  }

  const handleReplySubmit = async (commentId: number) => {
    if (!replyText.trim() || !discussion) return
    try {
      if (!authAPI.isAuthenticated()) { alert('נדרש להתחבר מחדש'); router.push('/login'); return }
      await discussionsAPI.createComment(discussion.id, replyText, commentId)
      setReplyText('')
      setReplyTo(null)
      await loadDiscussionAndComments()
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Could not validate credentials') || msg.includes('Unauthorized')) {
        alert('⚠️ הפג תוקף ההתחברות\n\nאנא התחבר מחדש.')
        router.push('/login')
      } else {
        alert('שגיאה בשליחת התשובה: ' + msg)
      }
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התגובה?')) return
    try {
      await discussionsAPI.deleteComment(commentId)
      await loadDiscussionAndComments()
    } catch (err) {
      alert('שגיאה במחיקת התגובה')
    }
  }

  const handleAskAI = async () => {
    if (!aiQuestion.trim() || aiLoading) return
    const q = aiQuestion.trim()
    setAiMessages(prev => [...prev, { role: 'user', text: q }])
    setAiQuestion('')
    setAiLoading(true)
    try {
      const res = await aiAPI.askQuestion(q, parseInt(materialId))
      setAiMessages(prev => [...prev, { role: 'ai', text: res.answer }])
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'שגיאה'
      setAiMessages(prev => [...prev, { role: 'ai', text: `שגיאה: ${msg}` }])
    } finally {
      setAiLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div dir="rtl" className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">טוען חומר...</p>
        </div>
      </div>
    )
  }

  if (error || !material) {
    return (
      <div dir="rtl" className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'חומר לא נמצא'}</p>
          <button onClick={goBack} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm hover:bg-slate-800 transition-colors">
            חזרה לרשימת החומרים
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
    <div dir="rtl" className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Fixed sidebar */}
      <aside className="fixed right-0 top-0 h-full w-16 bg-slate-900 flex flex-col items-center py-4 z-40">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center mb-6 flex-shrink-0">
          <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <button onClick={goBack} title="חזרה לחומרים"
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

      <div className="mr-16 flex flex-col flex-1 overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 truncate">{material.title}</h1>
          </div>
          <NotificationBell align="left" />
        </header>

        {/* Body row — RTL: first DOM child = visual RIGHT */}
        <div className="flex flex-1 overflow-hidden">

          {/* AI Panel — first in DOM = visual RIGHT (adjacent to sidebar) */}
          <div className={`flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${aiPanelOpen ? 'w-80' : 'w-0'}`}>
            {aiPanelOpen && (
              <>
                <div className="px-4 py-3 bg-slate-900 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                    </svg>
                    שאל את ה-AI
                  </h3>
                  <button onClick={() => setAiPanelOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {aiMessages.length === 0 && (
                    <div className="text-center mt-10 px-4">
                      <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-600 mb-1">שאל שאלה על החומר</p>
                      <p className="text-xs text-slate-400">ה-AI יענה על שאלות מתוך תוכן הסיכום</p>
                    </div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-slate-900 text-white rounded-tr-sm'
                          : 'bg-gray-100 text-slate-800 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-end">
                      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={aiEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-100 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && aiQuestion.trim() && !aiLoading) handleAskAI() }}
                      placeholder="שאל שאלה..."
                      disabled={aiLoading}
                      className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-right outline-none disabled:bg-gray-50"
                    />
                    <button
                      onClick={handleAskAI}
                      disabled={!aiQuestion.trim() || aiLoading}
                      className="w-9 h-9 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-200 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Main scrollable content — center */}
          <main className="flex-1 overflow-y-auto p-6 space-y-4 min-w-0">

            {/* Material meta */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
              {material.description && (
                <p className="text-sm text-slate-500 mb-3">{material.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4.5 h-4.5 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {material.uploader_full_name || material.uploader_username || `משתמש #${material.uploader_id}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(material.created_at).toLocaleDateString('he-IL')}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {material.download_count || 0} הורדות
                </span>
                <span className="flex items-center gap-1.5 text-yellow-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-slate-600 font-medium">{material.average_rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-slate-400">({material.rating_count || 0})</span>
                </span>
              </div>
            </div>

            {/* File Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">טוען קובץ...</p>
                  </div>
                </div>
              ) : previewError ? (
                <div className="flex items-center justify-center py-16 px-8">
                  <div className="text-center max-w-md">
                    {/* File type icon for Office files */}
                    {['.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls'].includes(fileExtension) ? (
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                        ['.docx', '.doc'].includes(fileExtension) ? 'bg-blue-100' :
                        ['.pptx', '.ppt'].includes(fileExtension) ? 'bg-orange-100' :
                        'bg-green-100'
                      }`}>
                        {['.docx', '.doc'].includes(fileExtension) ? (
                          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 18l-1.5-6h1.2l.9 4.2.9-4.2H11l.9 4.2.9-4.2h1.2l-1.5 6h-1.3l-.8-3.6-.8 3.6H8.5z"/>
                          </svg>
                        ) : ['.pptx', '.ppt'].includes(fileExtension) ? (
                          <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM9 13h2.5c1.38 0 2.5.9 2.5 2s-1.12 2-2.5 2H10v2H9v-6zm1 3h1.5c.55 0 1-.45 1-1s-.45-1-1-1H10v2z"/>
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 17h2v-4H8v4zm3 0h2v-6h-2v6zm3 0h2v-2h-2v2z"/>
                          </svg>
                        )}
                      </div>
                    ) : (
                      <svg className="w-12 h-12 text-yellow-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    <p className="text-slate-700 font-medium mb-1">{previewError}</p>
                    <p className="text-slate-400 text-xs mb-4">{material.file_name}</p>
                    {/* Download button when preview fails */}
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 px-5 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      הורד קובץ
                    </button>
                  </div>
                </div>
              ) : filePreviewUrl ? (
                // PDF/Converted Preview - use blob URL (works for PDF and converted Office files)
                <div className="flex justify-center px-6 py-4">
                  <iframe
                    src={filePreviewUrl}
                    className="border-0 rounded-xl"
                    style={{ height: '75vh', width: '75%' }}
                    title="תצוגה מקדימה"
                  />
                </div>
              ) : !material.file_name ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-blue-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-slate-600 font-medium mb-1">לא קיים קובץ מצורף</p>
                    <p className="text-slate-400 text-xs">ייתכן שמדובר בקישור חיצוני</p>
                  </div>
                </div>
              ) : null}

              {material.external_url && (
                <div className="px-6 py-4 border-t border-gray-100">
                  <a href={material.external_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    קישור חיצוני לחומר
                  </a>
                </div>
              )}
            </div>

            {/* Discussion */}
            <div ref={discussionRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-800">דיון על הסיכום</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">מיין לפי:</span>
                  <div className="flex gap-1">
                    <button onClick={() => setCommentSortBy('newest')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${commentSortBy === 'newest' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200'}`}>
                      הכי חדש
                    </button>
                    <button onClick={() => setCommentSortBy('most_voted')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${commentSortBy === 'most_voted' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200'}`}>
                      הכי מוצבע
                    </button>
                  </div>
                </div>
              </div>

              {/* Add comment */}
              <div className="mb-5">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="הוסף תגובה..."
                  rows={3}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none text-right"
                />
                <div className="flex justify-start mt-2">
                  <button onClick={handleCommentSubmit} disabled={!comment.trim()}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm rounded-xl transition-colors">
                    פרסם תגובה
                  </button>
                </div>
              </div>

              {/* Comments */}
              {isLoadingComments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">טוען תגובות...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {getSortedComments(comments).map((commentItem) => (
                    <div key={commentItem.id} id={`comment-${commentItem.id}`} className="border-r-2 border-slate-200 pr-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-600 font-bold text-xs">
                            {(commentItem.author_full_name || commentItem.author_username || 'א').charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-slate-800">
                              {commentItem.author_full_name || commentItem.author_username || 'משתמש'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(commentItem.created_at).toLocaleDateString('he-IL')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{commentItem.content}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => handleVoteComment(commentItem.id, 'upvote')}
                              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 11H4a2 2 0 00-2 2v6a2 2 0 002 2h3z" />
                              </svg>
                              {commentItem.upvotes || 0}
                            </button>
                            <button onClick={() => handleVoteComment(commentItem.id, 'downvote')}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zM17 13h3a2 2 0 002-2V5a2 2 0 00-2-2h-3z" />
                              </svg>
                              {commentItem.downvotes || 0}
                            </button>
                            <button onClick={() => setReplyTo(commentItem.id)}
                              className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                              הגב
                            </button>
                            {currentUser?.id === commentItem.author_id && (
                              <button onClick={() => handleDeleteComment(commentItem.id)}
                                className="text-xs text-red-400 hover:text-red-600 transition-colors">
                                מחק
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reply form */}
                      {replyTo === commentItem.id && (
                        <div className="mr-11 mt-3">
                          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                            placeholder="כתוב תשובה..." rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none text-right" />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleReplySubmit(commentItem.id)} disabled={!replyText.trim()}
                              className="px-4 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 disabled:bg-gray-200 text-white rounded-lg transition-colors">
                              פרסם
                            </button>
                            <button onClick={() => { setReplyTo(null); setReplyText('') }}
                              className="px-4 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-lg transition-colors">
                              ביטול
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {commentItem.replies?.length > 0 && (
                        <div className="mr-11 mt-3 space-y-3">
                          {commentItem.replies.map((reply: any) => (
                            <div key={reply.id} id={`comment-${reply.id}`} className="flex items-start gap-2">
                              <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-slate-500 font-bold text-xs">
                                  {(reply.author_full_name || reply.author_username || 'א').charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-semibold text-slate-700">
                                    {reply.author_full_name || reply.author_username || 'משתמש'}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {new Date(reply.created_at).toLocaleDateString('he-IL')}
                                  </span>
                                  {currentUser?.id === reply.author_id && (
                                    <button onClick={() => handleDeleteComment(reply.id)}
                                      className="text-xs text-red-400 hover:text-red-600 mr-auto">
                                      מחק
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600">{reply.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <button onClick={() => handleVoteComment(reply.id, 'upvote')}
                                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 11H4a2 2 0 00-2 2v6a2 2 0 002 2h3z" />
                                    </svg>
                                    {reply.upvotes || 0}
                                  </button>
                                  <button onClick={() => handleVoteComment(reply.id, 'downvote')}
                                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zM17 13h3a2 2 0 002-2V5a2 2 0 00-2-2h-3z" />
                                    </svg>
                                    {reply.downvotes || 0}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      אין תגובות עדיין. היה הראשון להגיב!
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>

          {/* Controls panel — last in DOM = visual LEFT */}
          <div className="w-80 flex-shrink-0 p-5 space-y-4 overflow-y-auto">

            {/* Ask AI button — glow border */}
            <div
              className="relative rounded-2xl p-[2px] transition-all duration-700 cursor-pointer"
              style={{
                background: aiPanelOpen
                  ? 'linear-gradient(135deg, #64748b, #94a3b8, #64748b)'
                  : bulbLit
                    ? 'linear-gradient(135deg, #fde047, #f59e0b, #fbbf24, #fde047)'
                    : 'linear-gradient(135deg, #92400e, #78350f, #92400e)',
                boxShadow: aiPanelOpen
                  ? '0 0 12px 2px rgba(148,163,184,0.3)'
                  : bulbLit
                    ? '0 0 24px 6px rgba(253,224,71,0.55), 0 0 48px 12px rgba(251,191,36,0.25)'
                    : '0 0 8px 2px rgba(146,64,14,0.25)',
              }}
              onClick={() => setAiPanelOpen(prev => !prev)}
            >
              <div className="w-full flex items-center justify-center gap-3 py-5 px-5 rounded-[14px] font-bold text-base bg-slate-900 hover:bg-slate-800 transition-colors duration-200 select-none">
                <span className="relative flex-shrink-0">
                  <svg
                    className={`w-7 h-7 transition-all duration-500 ${
                      bulbLit
                        ? 'text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,1)]'
                        : 'text-slate-500'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                  </svg>
                  {bulbLit && !aiPanelOpen && (
                    <span className="absolute inset-0 rounded-full blur-lg opacity-70 bg-yellow-300 transition-opacity duration-500" />
                  )}
                </span>
                <span className={`transition-colors duration-500 ${bulbLit ? 'text-white' : 'text-slate-400'}`}>
                  {aiPanelOpen ? 'סגור AI' : 'שאל את ה-AI'}
                </span>
              </div>
            </div>

            {/* Quiz button - temporarily disabled */}

            {/* Download */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <button onClick={handleDownload}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                הורד קובץ
              </button>
              <p className="text-sm text-center text-slate-400 mt-2.5">
                <span className="font-bold text-slate-600">{material.download_count}</span> הורדות
              </p>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-slate-600 mb-3 text-center">
                {canRate ? 'דרג את הסיכום' : 'הסיכום שלך'}
              </h3>
              {!canRate && (
                <p className="text-xs text-slate-400 text-center mb-2">לא ניתן לדרג חומר שהעלית</p>
              )}
              <div className="flex justify-center gap-1.5 mb-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star}
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => canRate && setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={!canRate}
                    className={`transition-all ${canRate ? 'hover:scale-125 cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  >
                    <svg className={`w-8 h-8 ${star <= (hoverRating || userRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                      fill={star <= (hoverRating || userRating) ? 'currentColor' : 'none'}
                      stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="text-center text-sm text-slate-400">
                <span className="font-bold text-yellow-500 text-base">{material.average_rating?.toFixed(1) || '0.0'}</span>
                {' '}ממוצע · {material.rating_count || 0} דירוגים
              </div>
            </div>

            {/* Jump to discussion */}
            <button onClick={scrollToDiscussion}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-slate-700 text-base font-medium py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              לדיון
            </button>

            {/* Report */}
            {canReport && (
              <button onClick={handleReport}
                className={`w-full text-base font-medium py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  hasReported
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {hasReported
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  }
                </svg>
                {hasReported ? 'בטל דיווח' : 'דווח על חומר'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>

    {/* ===== QUIZ MODAL ===== */}
    {quizOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { if (!quizLoading) setQuizOpen(false) }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <button onClick={() => setQuizOpen(false)} disabled={quizLoading} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h2 className="font-bold text-slate-800">בחן את עצמך</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">

            {/* Start screen */}
            {quizQuestions.length === 0 && !quizLoading && (
              <div className="flex flex-col items-center text-center gap-5 py-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">מוכן לבחינה?</h3>
                  <p className="text-slate-500 text-sm">ה-AI יייצר שאלות אמריקאיות על בסיס תוכן החומר</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-3">
                  <span className="text-sm text-slate-600">מספר שאלות:</span>
                  {[3, 5, 10].map(n => (
                    <button key={n} onClick={() => setQuizNumQuestions(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${quizNumQuestions === n ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-indigo-50 border border-gray-200'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    setQuizLoading(true)
                    setQuizAnswers([])
                    setQuizSubmitted(false)
                    try {
                      const res = await aiAPI.generateQuiz(Number(materialId), quizNumQuestions)
                      setQuizQuestions(res.questions)
                      setQuizAnswers(new Array(res.questions.length).fill(null))
                    } catch (err: any) {
                      const msg = err?.message || ''
                      if (msg.includes('429') || msg.includes('מגבלת')) {
                        alert('חרגת ממגבלת הבקשות של Gemini. נסה שוב בעוד כ-15 שניות.')
                      } else {
                        alert('שגיאה ביצירת השאלות. אנא נסה שוב.')
                      }
                    } finally {
                      setQuizLoading(false)
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
                  התחל חידון
                </button>
              </div>
            )}

            {/* Loading */}
            {quizLoading && (
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">מייצר שאלות...</p>
              </div>
            )}

            {/* Questions */}
            {quizQuestions.length > 0 && !quizLoading && (
              <div className="space-y-6">
                {quizQuestions.map((q, qi) => (
                  <div key={qi} className="bg-gray-50 rounded-xl p-5">
                    <p className="font-semibold text-slate-800 mb-3 text-sm leading-relaxed">
                      <span className="text-indigo-600 ml-1">{qi + 1}.</span> {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const isSelected = quizAnswers[qi] === oi
                        const isCorrect = oi === q.correct
                        let cls = 'w-full text-right px-4 py-2.5 rounded-lg text-sm border transition-colors '
                        if (!quizSubmitted) {
                          cls += isSelected ? 'bg-indigo-100 border-indigo-400 text-indigo-800 font-medium' : 'bg-white border-gray-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                        } else {
                          if (isCorrect) cls += 'bg-green-100 border-green-400 text-green-800 font-medium'
                          else if (isSelected && !isCorrect) cls += 'bg-red-100 border-red-400 text-red-800'
                          else cls += 'bg-white border-gray-200 text-slate-500'
                        }
                        return (
                          <button key={oi} disabled={quizSubmitted} onClick={() => {
                            const updated = [...quizAnswers]
                            updated[qi] = oi
                            setQuizAnswers(updated)
                          }} className={cls}>
                            <span className="text-slate-400 ml-2">{['א', 'ב', 'ג', 'ד'][oi]}.</span> {opt}
                          </button>
                        )
                      })}
                    </div>
                    {quizSubmitted && q.explanation && (
                      <p className="mt-3 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                        <span className="font-semibold text-blue-700">הסבר: </span>{q.explanation}
                      </p>
                    )}
                  </div>
                ))}

                {/* Score or Submit */}
                {quizSubmitted ? (
                  <div className="text-center py-4">
                    {(() => {
                      const score = quizAnswers.filter((a, i) => a === quizQuestions[i].correct).length
                      const pct = Math.round((score / quizQuestions.length) * 100)
                      return (
                        <div className={`inline-flex flex-col items-center gap-2 px-8 py-5 rounded-2xl ${pct >= 80 ? 'bg-green-50 border border-green-200' : pct >= 50 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                          <span className={`text-4xl font-black ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{pct}%</span>
                          <span className="text-slate-600 text-sm">{score} מתוך {quizQuestions.length} נכונות</span>
                          <button onClick={() => { setQuizQuestions([]); setQuizAnswers([]); setQuizSubmitted(false) }}
                            className="mt-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors">
                            נסה שוב
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <button
                    disabled={quizAnswers.some(a => a === null)}
                    onClick={() => setQuizSubmitted(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors">
                    הגש תשובות
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
