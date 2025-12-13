import Logo from '@/components/Logo'

/**
 * Profile Page Component
 * עמוד הפרופיל האישי של המשתמש
 * נמצא ב: /profile
 *
 * TODO: לממש את עמוד הפרופיל
 *
 * דרישות (מתוך מסמך הדרישות):
 * - הצגת פרטים אישיים:
 *   * שם מלא
 *   * שנה וחוג לימודים
 *   * רשימת קורסים
 *   * תמונת פרופיל
 * - סטטיסטיקות:
 *   * מספר סיכומים שהועלו
 *   * מספר הורדות שקיבל המשתמש
 *   * דירוג ממוצע מהקהילה
 * - אפשרות לערוך פרטי פרופיל
 * - סימון "מחפש שותף לימוד" לקורסים
 */
export default function ProfilePage() {
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-secondary-900">
                הפרופיל שלי
              </h1>
              <p className="text-secondary-600">
                פרטים אישיים וסטטיסטיקות
              </p>
            </div>

            {/* TODO: להוסיף תוכן פרופיל */}
            <div className="text-center py-12">
              <p className="text-secondary-500 text-lg">
                עמוד הפרופיל בבנייה...
              </p>
              <p className="text-secondary-400 text-sm mt-2">
                כאן יופיעו הפרטים האישיים והסטטיסטיקות שלך
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
