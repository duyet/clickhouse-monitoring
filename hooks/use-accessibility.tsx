'use client'

import type { ReactElement } from 'react'

import { useEffect, useState } from 'react'

/**
 * useAccessibilityId - Generate stable IDs for accessibility associations
 *
 * Generates a unique ID on mount that remains stable across re-renders.
 * Useful for connecting labels, descriptions, and error messages to inputs.
 *
 * @example
 * ```tsx
 * function FormInput() {
 *   const inputId = useAccessibilityId('email')
 *   const errorId = useAccessibilityId('email-error')
 *
 *   return (
 *     <>
 *       <label htmlFor={inputId}>Email</label>
 *       <input
 *         id={inputId}
 *         aria-invalid={hasError}
 *         aria-describedby={hasError ? errorId : undefined}
 *       />
 *       {hasError && (
 *         <span id={errorId} role="alert">{error}</span>
 *       )}
 *     </>
 *   )
 * }
 * ```
 */
export function useAccessibilityId(prefix: string): string {
  const [id] = useState(() => {
    // Generate a random suffix on mount only
    const suffix = Math.random().toString(36).substring(2, 9)
    return `a11y-${prefix}-${suffix}`
  })

  return id
}

/**
 * useReducedMotion - Detect user's reduced motion preference
 *
 * Returns true if the user has requested reduced motion via their OS settings.
 * Use this to conditionally disable animations and transitions.
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion()
 *
 *   return (
 *     <div
 *       className={
 *         prefersReducedMotion
 *           ? 'static'
 *           : 'animate-fade-in'
 *       }
 *     >
 *       Content
 *     </div>
 *   )
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])

  return prefersReducedMotion
}

/**
 * useFocusTrap - Trap focus within a container
 *
 * Ensures keyboard focus cannot leave a specified container.
 * Essential for modals, dialogs, and dropdown menus.
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const trapRef = useFocusTrap(isOpen)
 *
 *   if (!isOpen) return null
 *
 *   return (
 *     <div ref={trapRef} role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *       <button>Save</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useFocusTrap(isActive: boolean) {
  const [trapRef, setTrapRef] = useState<HTMLDivElement | null>(null)
  const [previousActiveElement, setPreviousActiveElement] =
    useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !trapRef) return

    // Store the element that had focus before trapping
    setPreviousActiveElement(document.activeElement as HTMLElement)

    const container = trapRef
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Focus the first element when trap activates
    firstFocusable?.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)

    return () => {
      document.removeEventListener('keydown', handleTabKey)

      // Restore focus when trap is disabled
      previousActiveElement?.focus()
    }
  }, [isActive, trapRef])

  return setTrapRef
}

/**
 * useFocusManagement - Restore focus after navigation or dialog close
 *
 * Stores the currently focused element and restores it later.
 * Useful for dialogs, dropdowns, and other temporary UI elements.
 *
 * @example
 * ```tsx
 * function Dialog({ isOpen, onClose }) {
 *   const { saveFocus, restoreFocus } = useFocusManagement()
 *
 *   useEffect(() => {
 *     if (isOpen) {
 *       saveFocus()
 *     } else {
 *       restoreFocus()
 *     }
 *   }, [isOpen, saveFocus, restoreFocus])
 *
 *   return <dialog>...</dialog>
 * }
 * ```
 */
export function useFocusManagement() {
  const [savedElement, setSavedElement] = useState<HTMLElement | null>(null)

  const saveFocus = () => {
    setSavedElement(document.activeElement as HTMLElement)
  }

  const restoreFocus = () => {
    if (savedElement) {
      savedElement.focus()
    }
  }

  return { saveFocus, restoreFocus }
}

/**
 * useAnnouncement - Announce messages to screen readers
 *
 * Provides a simple API for making announcements that screen readers
 * will vocalize. Useful for status updates, errors, and notifications.
 *
 * @example
 * ```tsx
 * function DataTable() {
 *   const { announce, Announcement } = useAnnouncement()
 *
 *   const handleSort = (column: string) => {
 *     sortData(column)
 *     announce(`Sorted by ${column}`)
 *   }
 *
 *   return (
 *     <>
 *       <button onClick={() => handleSort('name')}>Sort by Name</button>
 *       <Announcement />
 *     </>
 *   )
 * }
 * ```
 */
export function useAnnouncement(politeness: 'polite' | 'assertive' = 'polite') {
  const [announcement, setAnnouncement] = useState('')

  const announce = (message: string) => {
    setAnnouncement('')
    // Small delay to ensure screen reader registers the change
    setTimeout(() => {
      setAnnouncement(message)
    }, 100)
  }

  const Announcement = () =>
    announcement ? (
      <div
        aria-live={politeness}
        aria-atomic="true"
        role={politeness === 'assertive' ? 'alert' : 'status'}
        className="sr-only"
      >
        {announcement}
      </div>
    ) : null

  return { announce, Announcement }
}

/**
 * useKeyboardNavigation - Handle custom keyboard shortcuts
 *
 * Register keyboard shortcuts and trigger callbacks when pressed.
 * Supports modifier keys (Ctrl, Alt, Shift, Meta).
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useKeyboardNavigation({
 *     'k': () => console.log('K pressed'),
 *     'Ctrl+k': () => console.log('Cmd/Ctrl+K pressed'),
 *     'Escape': () => console.log('Escape pressed'),
 *   })
 *
 *   return <div>Content</div>
 * }
 * ```
 */
interface KeyboardMap {
  [key: string]: () => void
}

export function useKeyboardNavigation(keyMap: KeyboardMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Build key string with modifiers
      const modifiers: string[] = []
      if (e.ctrlKey) modifiers.push('Ctrl')
      if (e.altKey) modifiers.push('Alt')
      if (e.shiftKey) modifiers.push('Shift')
      if (e.metaKey) modifiers.push('Meta')

      const key = e.key
      const keyString =
        modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key

      // Check for exact match or match without modifiers
      if (keyMap[keyString]) {
        e.preventDefault()
        keyMap[keyString]()
      } else if (keyMap[key]) {
        e.preventDefault()
        keyMap[key]()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [keyMap])
}

/**
 * useScreenReaderOnly - Detect if user is likely using a screen reader
 *
 * Returns true if a screen reader may be active. This is a heuristic
 * and not 100% reliable, but can be useful for progressive enhancement.
 *
 * Note: This should be used sparingly and not for hiding content.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isScreenReaderActive = useScreenReaderOnly()
 *
 *   return (
 *     <div>
 *       {isScreenReaderActive ? (
 *         <p>Screen reader optimized content</p>
 *       ) : (
 *         <div>Visual content with animations</div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useScreenReaderOnly(): boolean {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    // Screen readers often set this to true
    if (window.speechSynthesis) {
      setIsActive(true)
    }

    // Some screen readers announce themselves via navigator object
    if (
      'navigator' in window &&
      (navigator as any).userAgent &&
      /(NVDA|JAWS|VoiceOver|TalkBack)/i.test((navigator as any).userAgent)
    ) {
      setIsActive(true)
    }
  }, [])

  return isActive
}

/**
 * useColorScheme - Detect user's color scheme preference
 *
 * Returns 'light', 'dark', or 'no-preference' based on system settings.
 * Useful for theming and ensuring proper contrast in all modes.
 *
 * @example
 * ```tsx
 * function ThemedComponent() {
 *   const colorScheme = useColorScheme()
 *
 *   return (
 *     <div className={colorScheme === 'dark' ? 'dark-theme' : 'light-theme'}>
 *       Content
 *     </div>
 *   )
 * }
 * ```
 */
export function useColorScheme(): 'light' | 'dark' | 'no-preference' {
  const [scheme, setScheme] = useState<'light' | 'dark' | 'no-preference'>(
    'no-preference'
  )

  useEffect(() => {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)')

    const updateScheme = () => {
      if (darkQuery.matches) {
        setScheme('dark')
      } else if (lightQuery.matches) {
        setScheme('light')
      } else {
        setScheme('no-preference')
      }
    }

    updateScheme()

    const listener = () => updateScheme()
    darkQuery.addEventListener('change', listener)
    lightQuery.addEventListener('change', listener)

    return () => {
      darkQuery.removeEventListener('change', listener)
      lightQuery.removeEventListener('change', listener)
    }
  }, [])

  return scheme
}
