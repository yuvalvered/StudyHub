import React from 'react'

/**
 * Logo Component Props Interface
 * Allows customization of logo size and variant
 */
interface LogoProps {
  /**
   * Size of the logo
   * - 'sm': Small (32px)
   * - 'md': Medium (48px) - default
   * - 'lg': Large (64px)
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Variant of the logo
   * - 'dark': Dark text on light background (default)
   * - 'light': Light text on dark background
   */
  variant?: 'dark' | 'light'
}

/**
 * Logo Component
 * Displays the StudyHub logo with icon and text
 * Used across all pages in the header (RTL layout)
 *
 * @param size - The size variant of the logo (default: 'md')
 * @param variant - Color variant: 'dark' or 'light' (default: 'dark')
 */
export default function Logo({ size = 'md', variant = 'dark' }: LogoProps) {
  // Define size classes for different variants
  const sizeClasses = {
    sm: 'h-8',  // 32px
    md: 'h-12', // 48px
    lg: 'h-16', // 64px
  }

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  // Text color based on variant
  // צבע טקסט בהתאם לוריאנט
  const textColorClass = variant === 'light' ? 'text-white' : 'text-secondary-900'

  // Icon background based on variant
  // רקע האייקון בהתאם לוריאנט
  const iconBgClass = variant === 'light' ? 'bg-white' : 'bg-primary-500'
  const iconColorClass = variant === 'light' ? 'text-primary-700' : 'text-white'

  return (
    <div className={`flex items-center gap-3 ${sizeClasses[size]}`}>
      {/* Logo Icon - Book symbol */}
      {/* אייקון הלוגו - סמל ספר */}
      <div className={`${iconSizeClasses[size]} ${iconBgClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <svg
          className={`w-2/3 h-2/3 ${iconColorClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Open book icon */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {/* טקסט הלוגו */}
      <span className={`font-bold ${textSizeClasses[size]} ${textColorClass}`}>
        StudyHub
      </span>
    </div>
  )
}
