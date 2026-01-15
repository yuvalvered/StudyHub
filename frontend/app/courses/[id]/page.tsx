'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import { coursesAPI, authAPI, discussionsAPI, searchAPI } from '@/lib/api'

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
  const handleSearchResultClick = (materialId: number) => {
    setShowSearchResults(false)
    setSearchQuery('')
    router.push(`/materials/${materialId}`)
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

        // Fetch course details, materials, and discussions
        const [courseData, materialsData, discussionsData] = await Promise.all([
          coursesAPI.getCourseById(courseId),
          coursesAPI.getCourseMaterials(courseId),
          discussionsAPI.getCourseDiscussions(courseId)
        ])

        setCourse(courseData)
        setMaterials(Array.isArray(materialsData) ? materialsData : [])
        setDiscussions(Array.isArray(discussionsData) ? discussionsData : [])
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
   * רינדור תגובה בודדת עם התשובות שלה
   */
  const renderComment = (comment: any, depth: number = 0) => {
    return (
      <div key={comment.id} className={depth > 0 ? 'mr-6 mt-3' : ''}>
        <div className="bg-white border border-secondary-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <span className="font-medium">{comment.author_username}</span>
              <span>•</span>
              <span>{new Date(comment.created_at).toLocaleDateString('he-IL')}</span>
            </div>
            <button
              onClick={() => setReplyToComment(comment)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>הגב</span>
            </button>
          </div>
          <p className="text-secondary-900 whitespace-pre-wrap mb-3">{comment.content}</p>

          {/* Like/Dislike Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleVoteComment(comment.id, 'upvote')}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition-colors"
              title="לייק"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 11H4a2 2 0 00-2 2v6a2 2 0 002 2h3z" />
              </svg>
              <span className="font-medium">{comment.upvotes || 0}</span>
            </button>
            <button
              onClick={() => handleVoteComment(comment.id, 'downvote')}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
              title="דיסלייק"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zM17 13h3a2 2 0 002-2V5a2 2 0 00-2-2h-3z" />
              </svg>
              <span className="font-medium">{comment.downvotes || 0}</span>
            </button>
          </div>
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
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

            {/* Center - Search Box */}
            <div className="flex-1 max-w-2xl mx-4 relative" ref={searchDropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="חפש חומרים..."
                  className="w-full px-4 py-2 pr-10 text-sm border-2 border-white/20 rounded-lg bg-white/10 text-white placeholder-white/60 focus:bg-white focus:text-secondary-900 focus:placeholder-secondary-400 focus:ring-2 focus:ring-white focus:border-white transition-all"
                />
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-primary-200 max-h-[500px] overflow-y-auto">
                  {isSearching ? (
                    <div className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3"></div>
                      <p className="text-secondary-600">מחפש...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result, index) => {
                        const isCurrentCourse = result.course_id === parseInt(courseId)
                        return (
                          <div key={result.material_id}>
                            {/* Separator between current course and other courses */}
                            {index > 0 &&
                             searchResults[index - 1].course_id === parseInt(courseId) &&
                             !isCurrentCourse && (
                              <div className="px-6 py-2 bg-secondary-50 border-y border-secondary-200">
                                <p className="text-xs font-semibold text-secondary-600 uppercase">תוצאות מקורסים אחרים</p>
                              </div>
                            )}

                            <button
                              onClick={() => handleSearchResultClick(result.material_id)}
                              className="w-full px-6 py-4 hover:bg-primary-50 transition-colors text-right border-b border-secondary-100 last:border-b-0"
                            >
                              <div className="flex items-start gap-3">
                                {/* Material Type Icon */}
                                <div className={`flex-shrink-0 mt-1 ${isCurrentCourse ? 'text-primary-600' : 'text-secondary-400'}`}>
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                                    <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                                  </svg>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-base mb-1 ${isCurrentCourse ? 'text-secondary-900' : 'text-secondary-700'}`}>
                                    {result.title}
                                  </p>
                                  <p className="text-xs text-primary-600 mb-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                    </svg>
                                    {result.course_name}
                                    {isCurrentCourse && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-semibold">קורס זה</span>}
                                  </p>
                                  {result.snippet && (
                                    <p className="text-xs text-secondary-600 line-clamp-2 bg-secondary-50 px-3 py-2 rounded-lg">
                                      ...{result.snippet}...
                                    </p>
                                  )}
                                  <p className="text-xs text-secondary-400 mt-1">
                                    {result.match_type === 'title' && 'נמצא בכותרת'}
                                    {result.match_type === 'description' && 'נמצא בתיאור'}
                                    {result.match_type === 'content' && 'נמצא בתוכן הקובץ'}
                                    {result.match_type === 'filename' && 'נמצא בשם הקובץ'}
                                  </p>
                                </div>
                              </div>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <svg className="w-16 h-16 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-secondary-600 font-medium">לא נמצאו תוצאות</p>
                      <p className="text-secondary-400 text-sm mt-1">נסה מושג חיפוש אחר</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Left side - Navigation Buttons */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />

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
                          <p className="font-medium text-secondary-900">{partner.full_name}</p>
                          <p className="text-sm text-secondary-600">{partner.email}</p>
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

                {/* Discussions Section */}
                <div className="mt-6 pt-6 border-t border-secondary-200">
                  <button
                    onClick={() => {
                      setShowCreateDiscussion(true)
                      loadDiscussions()
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 mb-4"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    הוסף דיון
                  </button>

                  {/* Discussions List */}
                  {discussions.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-secondary-900 mb-3">
                        דיונים קיימים
                      </h3>
                      {discussions.map((discussion) => (
                        <button
                          key={discussion.id}
                          onClick={() => loadDiscussionWithComments(discussion.id)}
                          className="w-full bg-secondary-50 hover:bg-secondary-100 rounded-lg p-3 text-right transition-colors"
                        >
                          <p className="font-medium text-secondary-900">{discussion.title}</p>
                          <p className="text-xs text-secondary-600 mt-1">
                            {discussion.author_username} • {discussion.comment_count || 0} תגובות
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Discussion Modal */}
      {showCreateDiscussion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900">צור דיון חדש</h2>
                <button
                  onClick={() => {
                    setShowCreateDiscussion(false)
                    setDiscussionTitle('')
                    setDiscussionContent('')
                  }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-secondary-700 font-medium mb-2">
                    כותרת הדיון
                  </label>
                  <input
                    type="text"
                    value={discussionTitle}
                    onChange={(e) => setDiscussionTitle(e.target.value)}
                    placeholder="הזן כותרת לדיון..."
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-secondary-700 font-medium mb-2">
                    תוכן הדיון
                  </label>
                  <textarea
                    value={discussionContent}
                    onChange={(e) => setDiscussionContent(e.target.value)}
                    placeholder="כתוב את תוכן הדיון..."
                    rows={6}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateDiscussion}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  צור דיון
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discussion Detail Modal */}
      {selectedDiscussion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900">{selectedDiscussion.title}</h2>
                <button
                  onClick={() => {
                    setSelectedDiscussion(null)
                    setDiscussionComments([])
                    setNewComment('')
                    setReplyToComment(null)
                  }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Discussion Content */}
              <div className="bg-secondary-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-secondary-600 mb-2">
                  <span className="font-medium">{selectedDiscussion.author_username}</span>
                  <span>•</span>
                  <span>{new Date(selectedDiscussion.created_at).toLocaleDateString('he-IL')}</span>
                </div>
                <p className="text-secondary-900 whitespace-pre-wrap">{selectedDiscussion.content}</p>
              </div>

              {/* Comments Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-secondary-900 mb-4">
                  תגובות ({discussionComments.length})
                </h3>

                {/* Sort Controls */}
                <div className="mb-4 flex items-center gap-3 pb-4 border-b border-secondary-200">
                  <span className="text-sm font-medium text-secondary-700">מיין לפי:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCommentSortBy('newest')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        commentSortBy === 'newest'
                          ? 'bg-primary-600 text-white'
                          : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                      }`}
                    >
                      הכי חדש
                    </button>
                    <button
                      onClick={() => setCommentSortBy('most_voted')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        commentSortBy === 'most_voted'
                          ? 'bg-primary-600 text-white'
                          : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                      }`}
                    >
                      הכי מוצבע
                    </button>
                  </div>
                </div>

                {/* Add Comment Form */}
                <div className="mb-6">
                  {/* Reply indicator */}
                  {replyToComment && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="text-sm text-blue-800">
                          משיב ל-<span className="font-medium">{replyToComment.author_username}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setReplyToComment(null)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyToComment ? `הגב ל-${replyToComment.author_username}...` : "הוסף תגובה..."}
                    rows={3}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={handleAddComment}
                    className="mt-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-2 px-6 rounded-lg transition-all"
                  >
                    {replyToComment ? 'שלח תשובה' : 'הוסף תגובה'}
                  </button>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {discussionComments.length > 0 ? (
                    getSortedComments(discussionComments).map((comment) => renderComment(comment))
                  ) : (
                    <p className="text-center text-secondary-500 py-8">
                      אין תגובות עדיין. היה הראשון להגיב!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
