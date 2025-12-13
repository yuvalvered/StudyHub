'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'

/**
 * Login Page Component
 * עמוד ההתחברות של המערכת
 * נמצא ב: /login
 *
 * Features:
 * - Username and password input fields (שדות שם משתמש וסיסמה)
 * - Login button (כפתור התחברות)
 * - Link to create new account (קישור ליצירת משתמש חדש)
 * - Logo display in top-right corner (לוגו בפינה ימנית עליונה)
 * - Clean blue theme design (עיצוב נקי בגווני כחול)
 * - Full RTL support for Hebrew (תמיכה מלאה בעברית)
 */
export default function LoginPage() {
  const router = useRouter()

  // State management for form inputs
  // ניהול מצב עבור שדות הטופס
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Handles the login form submission
   * מטפל בשליחת טופס ההתחברות
   * Connects to the backend API for authentication
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Call backend API for login
      // קריאה ל-API של הבקאנד להתחברות
      const response = await authAPI.login(username, password)

      console.log('Login successful:', response)

      // Redirect to dashboard on success
      // העבר לדשבורד במקרה של הצלחה
      router.push('/dashboard')

    } catch (err) {
      // Display error message
      // הצג הודעת שגיאה
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('שגיאה בהתחברות. אנא נסה שנית.')
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header bar with logo - כחול כהה */}
      {/* שורה עליונה עם לוגו - רקע כחול כהה */}
      <header className="fixed top-0 left-0 right-0 bg-primary-700 shadow-md z-50">
        <div className="container mx-auto px-6 py-4 flex justify-start">
          <Logo size="md" variant="light" />
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      {/* הוספת ריווח בגלל ה-header הקבוע */}
      <div className="pt-20"></div>

      {/* Main login container - Centered on screen */}
      {/* מיכל התחברות ראשי - ממורכז במסך */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          {/* Login card */}
          {/* כרטיס התחברות */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Welcome heading */}
            {/* כותרת ברוכים הבאים */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-secondary-900">
                ברוכים הבאים
              </h1>
              <p className="text-secondary-600">
                התחבר כדי לגשת לפלטפורמת הלימוד
              </p>
            </div>

            {/* Error message display */}
            {/* הצגת הודעת שגיאה */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Login form */}
            {/* טופס התחברות */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username input field */}
              {/* שדה קלט שם משתמש */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-secondary-700"
                >
                  שם משתמש
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="הזן את שם המשתמש שלך"
                  required
                  autoComplete="username"
                />
              </div>

              {/* Password input field */}
              {/* שדה קלט סיסמה */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-secondary-700"
                >
                  סיסמה
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="הזן את הסיסמה שלך"
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* Forgot password link */}
              {/* קישור שכחתי סיסמה */}
              <div className="flex justify-start">
                <a
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                >
                  שכחתי סיסמה
                </a>
              </div>

              {/* Login button */}
              {/* כפתור התחברות */}
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
                    מתחבר...
                  </span>
                ) : (
                  'התחבר'
                )}
              </button>
            </form>

            {/* Divider */}
            {/* קו מפריד */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-secondary-500">או</span>
              </div>
            </div>

            {/* Create new account link */}
            {/* קישור ליצירת משתמש חדש */}
            <div className="text-center">
              <a
                href="/register"
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
              >
                יצירת משתמש חדש
              </a>
            </div>
          </div>

          {/* Footer text */}
          {/* טקסט תחתון */}
          <div className="mt-6 text-center text-sm text-secondary-600">
            <p>פלטפורמת שיתוף לימודים לסטודנטים</p>
            <p className="mt-1">אוניברסיטת בן-גוריון בנגב</p>
          </div>
        </div>
      </div>
    </div>
  )
}
