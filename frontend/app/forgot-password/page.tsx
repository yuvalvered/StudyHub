'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'

/**
 * Forgot Password Page Component
 * עמוד שכחתי סיסמה
 * נמצא ב: /forgot-password
 *
 * Features:
 * - Email input field for password reset request
 * - Sends password reset email to user
 * - Success message after email sent
 * - Link back to login page
 */
export default function ForgotPasswordPage() {
  const router = useRouter()

  // State management
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  /**
   * Handle form submission
   * Send password reset email
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await authAPI.forgotPassword(email)
      setSuccess(true)

      // Redirect to login after 5 seconds
      setTimeout(() => {
        router.push('/login')
      }, 5000)

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('שגיאה בשליחת המייל. אנא נסה שנית.')
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
                שכחתי סיסמה
              </h1>
              <p className="text-secondary-600">
                הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמה
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">המייל נשלח בהצלחה!</p>
                <p className="mt-1">בדוק את תיבת הדואר שלך לקישור לאיפוס הסיסמה.</p>
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
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
                    אימייל אוניברסיטאי <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="example@post.bgu.ac.il"
                    required
                    autoComplete="email"
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
                      שולח מייל...
                    </span>
                  ) : (
                    'שלח קישור לאיפוס סיסמה'
                  )}
                </button>
              </form>
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
