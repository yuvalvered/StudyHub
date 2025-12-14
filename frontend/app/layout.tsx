import type { Metadata } from 'next'
import './globals.css'

/**
 * Metadata configuration for the StudyHub application
 * Defines the title and description shown in browser tabs and search engines
 */
export const metadata: Metadata = {
  title: 'StudyHub - פלטפורמת שיתוף לימודים',
  description: 'פלטפורמה חכמה לשיתוף חומרי לימוד, מציאת שותפי לימוד ושאלות אקדמיות עם AI',
}

/**
 * Root Layout Component
 * This component wraps all pages in the application
 * It sets up the HTML structure with RTL support for Hebrew
 *
 * @param children - The page content to be rendered
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl">
      {/*
        lang="he" - Sets the page language to Hebrew
        dir="rtl" - Sets text direction to right-to-left for Hebrew support
      */}
      <body className="antialiased">
        {/* Main content area */}
        {children}
      </body>
    </html>
  )
}
