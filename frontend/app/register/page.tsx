'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'

/**
 * Register Page Component
 * עמוד הרישום של המערכת
 * נמצא ב: /register
 *
 * Features:
 * - Email validation for BGU university (@post.bgu.ac.il)
 * - Username, password, and full name fields
 * - Year of study selection
 * - Department/major field
 * - Password confirmation
 * - Full RTL support for Hebrew
 */
export default function RegisterPage() {
  const router = useRouter()

  // State management for form inputs
  // ניהול מצב עבור שדות הטופס
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    department: '',
    departmentNumber: '',
    yearOfStudy: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Year options
  // אופציות שנות לימוד
  const yearOptions = [
    { value: '1', label: 'שנה א\'' },
    { value: '2', label: 'שנה ב\'' },
    { value: '3', label: 'שנה ג\'' },
    { value: '4', label: 'שנה ד\'' },
  ]

  /**
   * Handle input changes
   * טיפול בשינויים בשדות הקלט
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // Clear error when user types
  }

  /**
   * Validate email is from BGU university
   * ולידציה שהמייל הוא מהאוניברסיטה
   */
  const validateEmail = (email: string): boolean => {
    return email.endsWith('@post.bgu.ac.il')
  }

  /**
   * Validate form before submission
   * ולידציה של הטופס לפני שליחה
   */
  const validateForm = (): boolean => {
    // Check all required fields
    if (!formData.email || !formData.username || !formData.fullName || !formData.password || !formData.department || !formData.departmentNumber || !formData.yearOfStudy) {
      setError('נא למלא את כל השדות החובה')
      return false
    }

    // Validate email format
    if (!validateEmail(formData.email)) {
      setError('יש להשתמש במייל אוניברסיטאי: @post.bgu.ac.il')
      return false
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('הסיסמה צריכה להכיל לפחות 6 תווים')
      return false
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return false
    }

    // Validate department number is a positive integer
    const deptNum = parseInt(formData.departmentNumber)
    if (isNaN(deptNum) || deptNum < 1) {
      setError('מספר מחלקה חייב להיות מספר חיובי')
      return false
    }

    return true
  }

  /**
   * Handle form submission
   * טיפול בשליחת הטופס
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Call backend API for registration
      // קריאה ל-API של הבקאנד לרישום
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        department: formData.department,
        department_number: parseInt(formData.departmentNumber),
        year_in_degree: parseInt(formData.yearOfStudy),
      })

      console.log('Registration successful')

      // Show success message
      setSuccess(true)

      // Don't redirect - user needs to verify email first
      // User will be redirected to login manually or after email verification

    } catch (err) {
      // Display error message
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('שגיאה ברישום. אנא נסה שנית.')
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header bar with logo - כחול כהה */}
      <header className="fixed top-0 left-0 right-0 bg-primary-700 shadow-md z-50">
        <div className="container mx-auto px-6 py-4 flex justify-start">
          <Logo size="md" variant="light" />
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="pt-20"></div>

      {/* Main container */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-secondary-900">
                יצירת משתמש חדש
              </h1>
              <p className="text-secondary-600">
                הצטרף לפלטפורמת שיתוף הלימודים
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg space-y-2">
                <p className="font-bold text-base">הרישום בוצע בהצלחה!</p>
                <p className="text-sm">נשלח אליך מייל לכתובת שהזנת עם קישור לאימות.</p>
                <p className="text-sm font-medium">אנא בדוק את תיבת הדואר שלך ולחץ על הקישור כדי לאמת את החשבון.</p>
                <p className="text-xs mt-2 text-green-600">לא קיבלת מייל? בדוק את תיקיית הספאם.</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Registration Form */}
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
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="example@post.bgu.ac.il"
                  required
                  autoComplete="email"
                />
                <p className="text-xs text-secondary-500">
                  יש להשתמש במייל האוניברסיטאי שלך (@post.bgu.ac.il)
                </p>
              </div>

              {/* Full Name Field */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-secondary-700">
                  שם מלא <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="הזן את שמך המלא"
                  required
                  autoComplete="name"
                />
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-secondary-700">
                  שם משתמש <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="בחר שם משתמש (3-50 תווים)"
                  required
                  minLength={3}
                  maxLength={50}
                  autoComplete="username"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
                  סיסמה <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="בחר סיסמה (לפחות 6 תווים)"
                  required
                  minLength={6}
                  autoComplete="new-password"
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
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="הזן את הסיסמה שנית"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {/* Department Field */}
              <div className="space-y-2">
                <label htmlFor="department" className="block text-sm font-medium text-secondary-700">
                  תואר לימוד <span className="text-red-500">*</span>
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="לדוגמה: מדעי המחשב, הנדסת תעשייה"
                  required
                />
              </div>

              {/* Department Number Field */}
              <div className="space-y-2">
                <label htmlFor="departmentNumber" className="block text-sm font-medium text-secondary-700">
                  מספר מחלקה <span className="text-red-500">*</span>
                </label>
                <input
                  id="departmentNumber"
                  name="departmentNumber"
                  type="number"
                  min="1"
                  value={formData.departmentNumber}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="לדוגמה: 401"
                  required
                />
              </div>

              {/* Year of Study Field */}
              <div className="space-y-2">
                <label htmlFor="yearOfStudy" className="block text-sm font-medium text-secondary-700">
                  שנת לימוד <span className="text-red-500">*</span>
                </label>
                <select
                  id="yearOfStudy"
                  name="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">בחר שנת לימוד</option>
                  {yearOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || success}
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
                    מבצע רישום...
                  </span>
                ) : (
                  'הירשם'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-secondary-500">כבר יש לך משתמש?</span>
              </div>
            </div>

            {/* Link to Login */}
            <div className="text-center">
              <a
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
              >
                התחבר כאן
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
