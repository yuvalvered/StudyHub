'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import { coursesAPI, authAPI, discussionsAPI, searchAPI, usersAPI } from '@/lib/api'

/**
 * Material Categories based on backend MaterialType enum
 * קטגוריות חומרי הלימוד
 */
const MATERIAL_CATEGORY_CONFIG = [
  {
    type: 'summaries', label: 'סיכומים',
    iconBg: 'bg-purple-100', iconColor: 'text-purple-600',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  },
  {
    type: 'lectures', label: 'הרצאות',
    iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  },
  {
    type: 'exercises', label: 'תרגולים',
    iconBg: 'bg-green-100', iconColor: 'text-green-600',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
  },
  {
    type: 'homework', label: 'עבודות',
    iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  },
  {
    type: 'exam_prep', label: 'מבחני עבר',
    iconBg: 'bg-red-100', iconColor: 'text-red-600',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
  },
  {
    type: 'quiz_prep', label: 'הכנה לבוחן',
    iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  {
    type: 'quizme', label: 'QuizMe',
    iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600',
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  },
]

/**
 * Course Details Page Component
 * עמוד פרטי קורס ספציפי
 */
export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedParams = use(params)
  const courseId = resolvedParams.id

  // State management
  const [course, setCourse] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [studyPartners, setStudyPartners] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStudyPartners, setShowStudyPartners] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)

  // Current user
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Discussions state
  const [discussions, setDiscussions] = useState<any[]>([])
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null)
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false)
  const [discussionTitle, setDiscussionTitle] = useState('')
  const [discussionContent, setDiscussionContent] = useState('')
  const [discussionComments, setDiscussionComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyToComment, setReplyToComment] = useState<any>(null)
  const [commentSortBy, setCommentSortBy] = useState<'newest' | 'most_voted'>('newest')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  /**
   * Handle search input change with debounce
   * טיפול בשינוי טקסט החיפוש עם עיכוב
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // If query is empty, hide results
    if (!value.trim()) {
      setShowSearchResults(false)
      setSearchResults([])
      return
    }

    // Set searching state
    setIsSearching(true)
    setShowSearchResults(true)

    // Debounce search - wait 300ms after user stops typing
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchAPI.searchMaterials(value.trim(), 15)

        // Sort results: current course first, then other courses
        const currentCourseResults = response.results.filter(
          (r: any) => r.course_id === parseInt(courseId)
        )
        const otherCoursesResults = response.results.filter(
          (r: any) => r.course_id !== parseInt(courseId)
        )

        setSearchResults([...currentCourseResults, ...otherCoursesResults])
        setIsSearching(false)
      } catch (err) {
        console.error('Error searching materials:', err)
        setIsSearching(false)
      }
    }, 300)
  }

  /**
   * Handle search result click
   */
  const handleSearchResultClick = (result: any) => {
    setShowSearchResults(false)
    setSearchQuery('')
    // Navigate to: /courses/{course_id}/materials/{type}/{material_id}
    router.push(`/courses/${result.course_id}/materials/${result.material_type}/${result.material_id}`)
  }

  /**
   * Close search dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchResults])

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

        // Fetch course details, materials, discussions, enrollment status and current user
        const [courseData, materialsData, discussionsData, myCourses, me] = await Promise.all([
          coursesAPI.getCourseById(courseId),
          coursesAPI.getCourseMaterials(courseId),
          discussionsAPI.getCourseDiscussions(courseId),
          usersAPI.getMyCourses(),
          usersAPI.getCurrentUser()
        ])
        setCurrentUser(me)

        setCourse(courseData)
        setMaterials(Array.isArray(materialsData) ? materialsData : [])
        setDiscussions(Array.isArray(discussionsData) ? discussionsData : [])
        const enrolled = Array.isArray(myCourses) && myCourses.some((c: any) => String(c.course_id || c.courseId || c.id) === String(courseId))
        setIsEnrolled(enrolled)
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
   * Open discussion from notification (via query parameters)
   */
  useEffect(() => {
    const discussionId = searchParams.get('discussion_id')
    const commentId = searchParams.get('comment_id')

    if (discussionId && discussions.length > 0) {
      // Find and open the discussion
      const discussionIdNum = parseInt(discussionId)
      loadDiscussionWithComments(discussionIdNum)

      // Scroll to comment if specified
      if (commentId) {
        setTimeout(() => {
          const element = document.querySelector(`#comment-${commentId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('bg-yellow-100', 'ring-2', 'ring-yellow-400', 'rounded-lg')
            setTimeout(() => {
              element.classList.remove('bg-yellow-100', 'ring-2', 'ring-yellow-400')
            }, 2000)
          }
        }, 500)
      }
    }
  }, [searchParams, discussions])

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
   * Load course discussions
   * טעינת דיוני הקורס
   */
  const loadDiscussions = async () => {
    try {
      const discussionsData = await discussionsAPI.getCourseDiscussions(courseId)
      setDiscussions(Array.isArray(discussionsData) ? discussionsData : [])
    } catch (err) {
      console.error('Error loading discussions:', err)
      alert('שגיאה בטעינת הדיונים')
    }
  }

  /**
   * Create a new discussion
   * יצירת דיון חדש
   */
  const handleCreateDiscussion = async () => {
    if (!discussionTitle.trim() || !discussionContent.trim()) {
      alert('נא למלא כותרת ותוכן לדיון')
      return
    }

    try {
      // Check authentication
      if (!authAPI.isAuthenticated()) {
        alert('נדרש להתחבר מחדש')
        router.push('/login')
        return
      }

      await discussionsAPI.createCourseDiscussion(courseId, discussionTitle, discussionContent)

      // Reset form
      setDiscussionTitle('')
      setDiscussionContent('')
      setShowCreateDiscussion(false)

      // Reload discussions
      await loadDiscussions()

      alert('הדיון נוצר בהצלחה!')
    } catch (err: any) {
      console.error('Error creating discussion:', err)
      const errorMessage = err instanceof Error ? err.message : ''

      if (errorMessage.includes('Could not validate credentials') || errorMessage.includes('Unauthorized')) {
        alert('⚠️ הפג תוקף ההתחברות\n\nאנא התחבר מחדש כדי להמשיך.')
        router.push('/login')
      } else {
        alert('שגיאה ביצירת הדיון: ' + errorMessage)
      }
    }
  }

  /**
   * Load discussion with comments
   * טעינת דיון עם תגובות
   */
  const loadDiscussionWithComments = async (discussionId: number) => {
    try {
      const [discussion, comments] = await Promise.all([
        discussionsAPI.getDiscussion(discussionId),
        discussionsAPI.getDiscussionComments(discussionId)
      ])

      setSelectedDiscussion(discussion)
      setDiscussionComments(Array.isArray(comments) ? comments : [])
    } catch (err) {
      console.error('Error loading discussion:', err)
      alert('שגיאה בטעינת הדיון')
    }
  }

  /**
   * Delete a comment from discussion
   */
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('האם למחוק את התגובה?')) return
    try {
      await discussionsAPI.deleteComment(commentId)
      if (selectedDiscussion) {
        await loadDiscussionWithComments(selectedDiscussion.id)
      }
    } catch (err) {
      console.error('Error deleting comment:', err)
    }
  }

  /**
   * Add comment to discussion
   * הוספת תגובה לדיון
   */
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedDiscussion) return

    const currentCommentsCount = discussionComments.length

    try {
      // Check authentication
      if (!authAPI.isAuthenticated()) {
        alert('נדרש להתחבר מחדש')
        router.push('/login')
        return
      }

      // If replying to a comment, pass the parent_comment_id
      await discussionsAPI.createComment(
        selectedDiscussion.id,
        newComment,
        replyToComment?.id
      )
      setNewComment('')
      setReplyToComment(null)

      // Reload comments
      await loadDiscussionWithComments(selectedDiscussion.id)
    } catch (err: any) {
      console.error('Error adding comment:', err)
      const errorMessage = err instanceof Error ? err.message : ''

      if (errorMessage.includes('Could not validate credentials') || errorMessage.includes('Unauthorized')) {
        alert('⚠️ הפג תוקף ההתחברות\n\nאנא התחבר מחדש כדי להמשיך.')
        router.push('/login')
      } else {
        // Backend might have created the comment but failed during notification
        // Wait and try to reload comments to verify
        console.log('Attempting to verify if comment was created despite error...')

        try {
          // Wait 500ms for backend to finish
          await new Promise(resolve => setTimeout(resolve, 500))

          // Fetch fresh comments directly from server to check if comment was created
          const freshComments = await discussionsAPI.getDiscussionComments(selectedDiscussion.id)
          const newCommentsCount = Array.isArray(freshComments) ? freshComments.length : 0

          // Check if a new comment was added by comparing with original count
          // This is a workaround for backend 500 errors that occur after comment creation
          if (newCommentsCount > currentCommentsCount) {
            console.log('Comment was created successfully despite 500 error')
            setNewComment('')
            setReplyToComment(null)
            // Update the UI with fresh comments
            await loadDiscussionWithComments(selectedDiscussion.id)
            // Don't show error - the comment was created successfully
          } else {
            alert('שגיאה בהוספת תגובה: ' + errorMessage)
          }
        } catch (reloadErr) {
          alert('שגיאה בהוספת תגובה: ' + errorMessage)
        }
      }
    }
  }

  /**
   * Vote on comment (upvote or downvote)
   * הצבעה על תגובה
   */
  const handleVoteComment = async (commentId: number, voteType: 'upvote' | 'downvote') => {
    try {
      await discussionsAPI.voteComment(commentId, voteType)

      // Reload comments to reflect updated vote counts
      if (selectedDiscussion) {
        await loadDiscussionWithComments(selectedDiscussion.id)
      }
    } catch (err) {
      console.error('Error voting on comment:', err)
      alert('שגיאה בהצבעה על התגובה')
    }
  }

  /**
   * Sort comments based on selected option
   * מיון תגובות לפי האופציה הנבחרת
   */
  const getSortedComments = (commentsToSort: any[]): any[] => {
    const sorted = [...commentsToSort]

    if (commentSortBy === 'newest') {
      // Sort by newest first (created_at descending)
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (commentSortBy === 'most_voted') {
      // Sort by most upvotes first (upvotes descending)
      sorted.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    }

    // Recursively sort replies for each comment
    return sorted.map(comment => ({
      ...comment,
      replies: comment.replies ? getSortedComments(comment.replies) : []
    }))
  }

  /**
   * Organize comments into a hierarchical structure
   * ארגון התגובות למבנה היררכי
   */
  const organizeComments = (comments: any[]) => {
    const commentMap = new Map()
    const rootComments: any[] = []

    // First pass: create a map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize into hierarchy
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)
      if (comment.parent_comment_id) {
        // This is a reply, add it to its parent's replies
        const parent = commentMap.get(comment.parent_comment_id)
        if (parent) {
          parent.replies.push(commentWithReplies)
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies)
      }
    })

    return rootComments
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

  /**
   * Render a single comment with its replies
   */
  const renderComment = (comment: any, depth: number = 0) => {
    return (
      <div key={comment.id} id={`comment-${comment.id}`} className={depth > 0 ? 'mr-6 mt-2' : ''}>
        <div className={`rounded-xl p-4 ${depth > 0 ? 'bg-gray-50 border border-gray-100' : 'bg-white border border-gray-100'}`}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{(comment.author_full_name || comment.author_username || 'א').charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleDateString('he-IL')}</span>
                  <span className="text-sm font-semibold text-slate-800">{comment.author_full_name || comment.author_username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setReplyToComment(comment)}
                    className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    הגב
                  </button>
                  {currentUser && (currentUser.username === comment.author_username || currentUser.id === comment.author_id) && (
                    <button onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      מחק
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap mb-2">{comment.content}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => handleVoteComment(comment.id, 'upvote')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-green-600 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 11H4a2 2 0 00-2 2v6a2 2 0 002 2h3z" />
                  </svg>
                  <span>{comment.upvotes || 0}</span>
                </button>
                <button onClick={() => handleVoteComment(comment.id, 'downvote')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zM17 13h3a2 2 0 002-2V5a2 2 0 00-2-2h-3z" />
                  </svg>
                  <span>{comment.downvotes || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div dir="rtl" className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">טוען נתוני קורס...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div dir="rtl" className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'קורס לא נמצא'}</p>
          <button onClick={goBack} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm">חזרה לדשבורד</button>
        </div>
      </div>
    )
  }

  const organizedComments = selectedDiscussion ? organizeComments(discussionComments) : []

  return (
    <div dir="rtl" className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ===== RIGHT SIDEBAR ===== */}
      <aside className="fixed right-0 top-0 h-full w-16 bg-slate-900 flex flex-col items-center py-5 z-50">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-6 flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <button onClick={goBack} title="חזור לדשבורד"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </nav>
        <button onClick={handleLogout} title="התנתק"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors flex-shrink-0">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="mr-16 flex flex-col flex-1 min-h-screen overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between flex-shrink-0 z-30">
          {/* Right (first in DOM = right in RTL): course info */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">{course.course_name}</h1>
              <p className="text-xs text-slate-400">{course.course_number}</p>
            </div>
            {!isEnrolled && (
              <button
                onClick={async () => {
                  setIsEnrolling(true)
                  try {
                    await usersAPI.enrollInCourse(Number(courseId))
                    setIsEnrolled(true)
                  } catch (err: any) {
                    if (err.message?.includes('already enrolled')) setIsEnrolled(true)
                  } finally {
                    setIsEnrolling(false)
                  }
                }}
                disabled={isEnrolling}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
                {isEnrolling ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                הירשם לקורס
              </button>
            )}
          </div>

          {/* Center: search */}
          <div className="flex-1 max-w-sm mx-6 relative" ref={searchDropdownRef}>
            <div className="relative">
              <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={searchQuery} onChange={e => handleSearchChange(e.target.value)}
                placeholder="חפש חומרים..."
                className="w-full pr-9 pl-4 py-2 text-sm bg-gray-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
            </div>
            {showSearchResults && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => {
                      const isCurrentCourse = result.course_id === parseInt(courseId)
                      return (
                        <div key={result.material_id}>
                          {index > 0 && searchResults[index - 1].course_id === parseInt(courseId) && !isCurrentCourse && (
                            <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                              <p className="text-xs font-medium text-slate-500">תוצאות מקורסים אחרים</p>
                            </div>
                          )}
                          <button onClick={() => handleSearchResultClick(result)}
                            className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-right border-b border-gray-50 last:border-b-0">
                            <p className="font-medium text-slate-800 text-sm">{result.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {result.course_name}{isCurrentCourse && <span className="text-blue-600 mr-1"> · קורס זה</span>}
                            </p>
                            {result.snippet && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1"
                                dangerouslySetInnerHTML={{ __html: result.snippet.split('\n\n')[0].replace(/\*\*(.*?)\*\*/g, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>') }} />
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="px-4 py-6 text-center text-sm text-slate-400">לא נמצאו תוצאות</p>
                )}
              </div>
            )}
          </div>

          {/* Left: bell */}
          <div className="flex items-center gap-3">
            <NotificationBell align="left" />
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* Material Categories */}
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 mb-3">חומרי לימוד</h2>
            <div className="grid grid-cols-12 gap-4">
              {MATERIAL_CATEGORY_CONFIG.map((cat, index) => {
                const count = getMaterialsCount(cat.type)
                const colSpan = index < 4 ? 'col-span-3' : 'col-span-4'
                return (
                  <button key={cat.type} onClick={() => handleCategoryClick(cat.type)}
                    className={`${colSpan} bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all text-center group`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${cat.iconBg} ${cat.iconColor} group-hover:scale-110 transition-transform`}>
                      {cat.icon}
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1 leading-tight">{cat.label}</p>
                    <span className="text-xs text-slate-400">{count > 0 ? `${count} חומרים` : 'אין חומרים'}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Bottom: discussions + study partners */}
          <div className="flex gap-4" style={{ minHeight: '420px' }}>

            {/* DISCUSSIONS */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <button onClick={() => setShowCreateDiscussion(true)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  דיון חדש
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400 bg-gray-100 px-2 py-0.5 rounded-full">{discussions.length}</span>
                  <h3 className="font-bold text-slate-800">דיון בקורס</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {discussions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-slate-500 text-sm font-medium">אין דיונים עדיין</p>
                    <p className="text-slate-400 text-xs mt-1">היה הראשון לפתוח דיון!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {discussions.map((discussion) => (
                      <button key={discussion.id} onClick={() => loadDiscussionWithComments(discussion.id)}
                        className="w-full px-5 py-4 hover:bg-gray-50 transition-colors text-right">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{(discussion.author_full_name || discussion.author_username || 'א').charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{discussion.title}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-slate-400">{discussion.author_full_name || discussion.author_username}</span>
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {discussion.comment_count || 0}
                              </span>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
                <button onClick={() => setShowCreateDiscussion(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                  כתוב הודעה לדיון
                </button>
              </div>
            </div>

            {/* STUDY PARTNERS */}
            <div className="w-72 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 flex items-center justify-between">
                {showStudyPartners && studyPartners.length > 0 && (
                  <span className="text-xs text-slate-400 bg-gray-100 px-2 py-0.5 rounded-full">{studyPartners.length} מחפשים</span>
                )}
                <h3 className="font-bold text-slate-800 mr-auto">שותפי למידה</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!showStudyPartners ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm">מצא שותפי למידה בקורס</p>
                    <button onClick={loadStudyPartners}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                      הצג שותפים
                    </button>
                  </div>
                ) : studyPartners.length > 0 ? (
                  <div className="space-y-2">
                    {studyPartners.map(partner => {
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                      const serverUrl = apiUrl.replace('/api/v1', '')
                      const imgUrl = partner.profile_image_url
                        ? (partner.profile_image_url.startsWith('http') ? partner.profile_image_url : `${serverUrl}/${partner.profile_image_url}`)
                        : null
                      return (
                        <div key={partner.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {imgUrl ? (
                              <img src={imgUrl} alt={partner.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xs font-bold">{(partner.full_name || partner.username || 'ש').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{partner.full_name || partner.username}</p>
                            {partner.department && (
                              <p className="text-xs text-slate-400 truncate">{partner.department}{partner.year_in_degree ? ` · שנה ${partner.year_in_degree}` : ''}</p>
                            )}
                            <p className="text-xs text-slate-400 truncate">{partner.email}</p>
                          </div>
                          <a
                            href={`mailto:${partner.email}?subject=${encodeURIComponent(`שותף למידה - ${course?.course_name || ''}`)}`}
                            title={`שלח מייל ל-${partner.full_name}`}
                            className="flex-shrink-0 w-7 h-7 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </a>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-slate-500 text-sm">אין שותפי למידה זמינים</p>
                    <p className="text-slate-400 text-xs mt-1">היה הראשון לחפש שותף!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ===== CREATE DISCUSSION MODAL ===== */}
      {showCreateDiscussion && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateDiscussion(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => { setShowCreateDiscussion(false); setDiscussionTitle(''); setDiscussionContent('') }}
                className="text-slate-400 hover:text-slate-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-slate-800">דיון חדש</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">כותרת הדיון</label>
                <input type="text" value={discussionTitle} onChange={e => setDiscussionTitle(e.target.value)}
                  placeholder="הזן כותרת לדיון..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">תוכן הדיון</label>
                <textarea value={discussionContent} onChange={e => setDiscussionContent(e.target.value)}
                  placeholder="כתוב את תוכן הדיון..." rows={5}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" />
              </div>
              <button onClick={handleCreateDiscussion}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
                פרסם דיון
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DISCUSSION DETAIL MODAL ===== */}
      {selectedDiscussion && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => { setSelectedDiscussion(null); setDiscussionComments([]); setNewComment(''); setReplyToComment(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between flex-shrink-0">
              <button onClick={() => { setSelectedDiscussion(null); setDiscussionComments([]); setNewComment(''); setReplyToComment(null) }}
                className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-sm font-bold text-white truncate max-w-xs">{selectedDiscussion.title}</h2>
            </div>

            {/* Discussion content */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{(selectedDiscussion.author_full_name || selectedDiscussion.author_username || 'א').charAt(0)}</span>
                </div>
                <span className="text-sm font-semibold text-slate-700">{selectedDiscussion.author_full_name || selectedDiscussion.author_username}</span>
                <span className="text-xs text-slate-400">{new Date(selectedDiscussion.created_at).toLocaleDateString('he-IL')}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedDiscussion.content}</p>
            </div>

            {/* Sort + count */}
            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex gap-2">
                <button onClick={() => setCommentSortBy('newest')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${commentSortBy === 'newest' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
                  הכי חדש
                </button>
                <button onClick={() => setCommentSortBy('most_voted')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${commentSortBy === 'most_voted' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
                  הכי מוצבע
                </button>
              </div>
              <span className="text-sm text-slate-500">{discussionComments.length} תגובות</span>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {discussionComments.length > 0 ? (
                getSortedComments(organizedComments).map(comment => renderComment(comment))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">אין תגובות עדיין. היה הראשון להגיב!</p>
                </div>
              )}
            </div>

            {/* Add comment */}
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              {replyToComment && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 flex items-center justify-between">
                  <span className="text-sm text-blue-700">משיב ל-<span className="font-medium">{replyToComment.author_full_name || replyToComment.author_username}</span></span>
                  <button onClick={() => setReplyToComment(null)} className="text-blue-400 hover:text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder={replyToComment ? `הגב ל-${replyToComment.author_full_name || replyToComment.author_username}...` : "כתוב תגובה..."}
                  rows={2} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" />
                <button onClick={handleAddComment}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 rounded-xl transition-colors flex-shrink-0">
                  {replyToComment ? 'הגב' : 'שלח'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
