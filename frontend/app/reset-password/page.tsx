'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'

/**
 * Reset Password Page Component - Content
 * עמוד איפוס סיסמה - תוכן
 */
function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get token from URL
  const token = searchParams.get('token')

  // State management
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Validate token exists
  useEffect(() => {
    if (!token) {
      setError('טוקן לא תקף. אנא בקש קישור חדש לאיפוס סיסמה.')
    }
  }, [token])

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    if (password.length < 6) {
      setError('הסיסמה צריכה להכיל לפחות 6 תווים')
      return false
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return false
    }

    return true
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('טוקן לא תקף')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await authAPI.resetPassword(token, password)
      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('שגיאה באיפוס הסיסמה. אנא נסה שנית.')
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header bar with logo */}
      <header className="fixed top-0 left-0 right-0 bg-primary-700 shadow-md z-50">
        <div className="container mx-auto px-6 py-4 flex justify-start">
          <Logo size="md" variant="light" />
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="pt-20"></div>

      {/* Main container */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-secondary-900">
                איפוס סיסמה
              </h1>
              <p className="text-secondary-600">
                הזן את הסיסמה החדשה שלך
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">הסיסמה אופסה בהצלחה!</p>
                <p className="mt-1">כעת תוכל להתחבר עם הסיסמה החדשה.</p>
                <p className="mt-1 text-xs">מעביר אותך לעמוד ההתחברות...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            {!success && token && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
                    סיסמה חדשה <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700">
                    אימות סיסמה <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="הזן את הסיסמה שנית"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
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
                      מאפס סיסמה...
                    </span>
                  ) : (
                    'אפס סיסמה'
                  )}
                </button>
              </form>
            )}

            {/* Link back to Login if no token */}
            {!token && (
              <div className="text-center">
                <a
                  href="/forgot-password"
                  className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
                >
                  בקש קישור חדש לאיפוס סיסמה
                </a>
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-secondary-500">או</span>
              </div>
            </div>

            {/* Link back to Login */}
            <div className="text-center">
              <a
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
              >
                חזרה להתחברות
              </a>
            </div>
          </div>

          {/* Footer text */}
          <div className="mt-6 text-center text-sm text-secondary-600">
            <p>פלטפורמת שיתוף לימודים לסטודנטים</p>
            <p className="mt-1">אוניברסיטת בן-גוריון בנגב</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Reset Password Page Component - Wrapper with Suspense
 * עמוד איפוס סיסמה
 * נמצא ב: /reset-password?token=XXX
 *
 * Features:
 * - New password input field
 * - Password confirmation field
 * - Validates token from URL query parameter
 * - Success message after password reset
 * - Link back to login page
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
