'use client'

import { useEffect, useState } from 'react'

interface SkipLinkProps {
  /** Text to display in the skip link */
  label?: string
  /** Target element ID to skip to */
  targetId?: string
}

/**
 * SkipLink - "Skip to main content" accessibility component
 *
 * Allows keyboard users to bypass navigation and jump directly to main content.
 * Hidden visually until focused (Tab key pressed), then appears at the top.
 *
 * WCAG 2.1 Success Criterion 2.4.1: "Bypass Blocks"
 * https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks
 *
 * @example
 * ```tsx
 * import { SkipLink } from '@/components/accessibility/skip-link'
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <SkipLink />
 *       <nav>...</nav>
 *       <main id="main-content">{children}</main>
 *     </>
 *   )
 * }
 * ```
 */
export function SkipLink({
  label = 'Skip to main content',
  targetId = 'main-content',
}: SkipLinkProps) {
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    // Ensure target element exists and can receive focus
    const target = document.getElementById(targetId)
    if (target && !target.getAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1')
    }
  }, [targetId])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      // Move focus to the first focusable element inside main if none is focused
      setTimeout(() => {
        const focusable = target.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      }, 100)
    }
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground
        focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg
        transition-all
        ${isFocused ? 'block' : ''}
      `}
    >
      {label}
    </a>
  )
}
