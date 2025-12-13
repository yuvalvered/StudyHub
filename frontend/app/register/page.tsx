import Logo from '@/components/Logo'

/**
 * Register Page Component
 * עמוד הרישום של המערכת
 * נמצא ב: /register
 *
 * TODO: לממש את עמוד הרישום
 *
 * דרישות (מתוך מסמך הדרישות):
 * - שדות: שם מלא, שם משתמש, מייל אוניברסיטאי, סיסמה
 * - ולידציה למייל: @post.bgu.ac.il בלבד
 * - שדה שנה וחוג לימודים
 * - תמונת פרופיל (אופציונלי)
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header bar with logo - כחול כהה */}
      <header className="fixed top-0 left-0 right-0 bg-primary-700 shadow-md z-50">
        <div className="container mx-auto px-6 py-4 flex justify-end">
          <Logo size="md" variant="light" />
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="pt-20"></div>

      {/* Main container */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-secondary-900">
                יצירת משתמש חדש
              </h1>
              <p className="text-secondary-600">
                הצטרף לפלטפורמת שיתוף הלימודים
              </p>
            </div>

            {/* TODO: להוסיף טופס רישום */}
            <div className="text-center py-12">
              <p className="text-secondary-500 text-lg">
                עמוד הרישום בבנייה...
              </p>
              <p className="text-secondary-400 text-sm mt-2">
                כאן יופיע טופס רישום עם כל השדות הנדרשים
              </p>
            </div>

            {/* קישור חזרה להתחברות */}
            <div className="text-center">
              <a
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
              >
                חזרה להתחברות
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
