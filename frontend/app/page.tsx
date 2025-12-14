import { redirect } from 'next/navigation'

/**
 * Root Page Component
 * עמוד השורש של האפליקציה (/)
 *
 * תפקיד: מפנה אוטומטית לעמוד ההתחברות
 *
 * כאשר משתמש נכנס ל-http://localhost:3000
 * הוא יופנה אוטומטית ל-http://localhost:3000/login
 */
export default function HomePage() {
  // Redirect to login page
  // הפניה אוטומטית לעמוד ההתחברות
  redirect('/login')
}
