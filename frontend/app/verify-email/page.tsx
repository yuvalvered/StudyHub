'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'

/**
 * Email Verification Page Component - Content
 * עמוד אימות מייל - תוכן
 */
function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get token from URL
  const token = searchParams.get('token')

  // State management
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  /**
   * Verify email on component mount
   */
  useEffect(() => {
    const verifyEmail = async () => {
      // Check if token exists
      if (!token) {
        setError('טוקן אימות לא תקף. אנא בקש קישור חדש.')
        setIsVerifying(false)
        return
      }

      try {
        // Call the verify-email endpoint
        await authAPI.verifyEmail(token)
        setSuccess(true)
        setIsVerifying(false)

        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              router.push('/dashboard')
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(timer)
      } catch (err) {
        setIsVerifying(false)
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('שגיאה באימות המייל. אנא נסה שנית.')
        }
      }
    }

    verifyEmail()
  }, [token, router])

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
                אימות כתובת מייל
              </h1>
            </div>

            {/* Verifying State */}
            {isVerifying && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <svg
                    className="animate-spin h-16 w-16 text-primary-600"
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
                </div>
                <p className="text-center text-secondary-600">
                  מאמת את כתובת המייל שלך...
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && !isVerifying && (
              <div className="space-y-4">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <svg
                      className="h-16 w-16 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Success Text */}
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center space-y-2">
                  <p className="font-bold text-lg">המייל אומת בהצלחה!</p>
                  <p className="text-sm">החשבון שלך פעיל כעת.</p>
                  <p className="text-sm">מעביר אותך לעמוד הקורסים בעוד {countdown} שניות...</p>
                </div>

                {/* Manual redirect button */}
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full btn-primary py-3 text-base font-semibold"
                >
                  עבור לעמוד הקורסים עכשיו
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && !isVerifying && (
              <div className="space-y-4">
                {/* Error Icon */}
                <div className="flex justify-center">
                  <div className="rounded-full bg-red-100 p-4">
                    <svg
                      className="h-16 w-16 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                </div>

                {/* Error Text */}
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                  <p className="font-medium">שגיאה באימות המייל</p>
                  <p className="mt-2 text-sm">{error}</p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full btn-primary py-3 text-base font-semibold"
                  >
                    חזרה להתחברות
                  </button>

                  <button
                    onClick={() => router.push('/register')}
                    className="w-full btn-secondary py-3 text-base font-semibold"
                  >
                    הרשמה מחדש
                  </button>
                </div>
              </div>
            )}
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
 * Email Verification Page Component - Wrapper with Suspense
 * עמוד אימות מייל
 * נמצא ב: /verify-email?token=XXX
 *
 * Features:
 * - Automatically verifies email when page loads
 * - Gets token from URL query parameter
 * - Shows loading state while verifying
 * - Shows success message and redirects to dashboard
 * - Shows error message if verification fails
 * - Links to login and register pages on error
 */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
