import Logo from '@/components/Logo'

/**
 * Dashboard Page Component
 * עמוד הבית של המשתמש המחובר
 * נמצא ב: /dashboard
 *
 * TODO: לממש את דף הדשבורד
 *
 * דרישות (מתוך מסמך הדרישות):
 * - הצגת רשימת הקורסים של הסטודנט
 * - חיפוש קורסים חדשים (לפי שם או מספר קורס)
 * - סטטיסטיקות אישיות:
 *   * מספר סיכומים שהועלו
 *   * מספר הורדות שקיבל המשתמש
 *   * דירוג ממוצע מהקהילה
 * - גישה מהירה לחומרים אחרונים
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header bar with logo - כחול כהה */}
      <header className="fixed top-0 left-0 right-0 bg-primary-700 shadow-md z-50">
        <div className="container mx-auto px-6 py-4 flex justify-end">
          <Logo size="md" variant="light" />
        </div>
      </header>

      {/* Main container */}
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-secondary-900">
                דף הבית
              </h1>
              <p className="text-secondary-600">
                ברוך הבא לפלטפורמת StudyHub
              </p>
            </div>

            {/* TODO: להוסיף תוכן דשבורד */}
            <div className="text-center py-12">
              <p className="text-secondary-500 text-lg">
                דף הבית בבנייה...
              </p>
              <p className="text-secondary-400 text-sm mt-2">
                כאן יופיעו הקורסים שלך, סטטיסטיקות וחיפוש
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
