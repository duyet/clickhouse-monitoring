'use client'

import { useEffect, useRef } from 'react'

interface FocusTrapOptions {
  /** Whether the focus trap is active */
  enabled?: boolean
  /** Function to call when attempting to focus outside the trap */
  onEscapeKey?: () => void
}

/**
 * useFocusTrap - Trap focus within a container (modals, dialogs)
 *
 * Ensures keyboard users cannot tab outside of a modal or dialog.
 * When the trap is disabled, focus returns to the element that had focus before trapping.
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const trapRef = useFocusTrap(enabled)
 *
 *   return (
 *     <div ref={trapRef} className="modal">
 *       <button onClick={onClose}>Close</button>
 *       <button>Save</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useFocusTrap(options: FocusTrapOptions = {}) {
  const { enabled = true, onEscapeKey } = options
  const trapRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !trapRef.current) return

    // Store the element that had focus before trapping
    previousActiveElement.current = document.activeElement as HTMLElement

    const container = trapRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Focus the first element when trap activates
    firstFocusable?.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      }
      // Tab
      else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscapeKey) {
        onEscapeKey()
      }
    }

    container.addEventListener('keydown', handleTabKey)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      container.removeEventListener('keydown', handleTabKey)
      document.removeEventListener('keydown', handleEscapeKey)

      // Restore focus when trap is disabled
      previousActiveElement.current?.focus()
    }
  }, [enabled, onEscapeKey])

  return trapRef
}

interface FocusScopeOptions {
  /** Whether to autoFocus the first element on mount */
  autoFocus?: boolean
  /** Whether to restore focus to previous element on unmount */
  restoreFocus?: boolean
}

/**
 * useFocusScope - Manage focus within a component
 *
 * Similar to focus trap but less restrictive. Ensures focus is managed
 * properly when a component mounts/unmounts without preventing tab navigation.
 *
 * @example
 * ```tsx
 * function Dropdown({ isOpen }) {
 *   const scopeRef = useFocusScope({ autoFocus: true, restoreFocus: true })
 *
 *   if (!isOpen) return null
 *
 *   return (
 *     <div ref={scopeRef}>
 *       <button>Action 1</button>
 *       <button>Action 2</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useFocusScope(options: FocusScopeOptions = {}) {
  const { autoFocus = false, restoreFocus = true } = options
  const scopeRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!scopeRef.current) return

    if (autoFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement

      const focusable = scopeRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      focusable?.focus()
    }

    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [autoFocus, restoreFocus])

  return scopeRef
}

interface ReturnFocusOptions {
  /** Whether to return focus on unmount */
  enabled?: boolean
}

/**
 * useReturnFocus - Return focus to previous element on unmount
 *
 * Simple hook that stores the active element on mount and returns
 * focus to it when the component unmounts.
 *
 * @example
 * ```tsx
 * function Modal({ onClose }) {
 *   const returnFocusRef = useReturnFocus()
 *
 *   return (
 *     <dialog ref={returnFocusRef}>
 *       <button onClick={onClose}>Close</button>
 *     </dialog>
 *   )
 * }
 * ```
 */
export function useReturnFocus(options: ReturnFocusOptions = {}) {
  const { enabled = true } = options
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    previousActiveElement.current = document.activeElement as HTMLElement

    return () => {
      previousActiveElement.current?.focus()
    }
  }, [enabled])
}

/**
 * getFocusableElements - Get all focusable elements within a container
 *
 * Utility function for manually managing focus in complex scenarios.
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null)
 *
 * const focusFirst = () => {
 *   const focusable = getFocusableElements(containerRef.current)
 *   focusable[0]?.focus()
 * }
 * ```
 */
export function getFocusableElements(
  container: HTMLElement | null
): HTMLElement[] {
  if (!container) return []

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
}

/**
 * focusFirst - Focus the first focusable element in a container
 *
 * Utility function for common focus management pattern.
 *
 * @example
 * ```tsx
 * const dialogRef = useRef<HTMLDivElement>(null)
 *
 * useEffect(() => {
 *   if (isOpen) {
 *     focusFirst(dialogRef.current)
 *   }
 * }, [isOpen])
 * ```
 */
export function focusFirst(container: HTMLElement | null): boolean {
  const elements = getFocusableElements(container)
  if (elements.length === 0) return false

  elements[0].focus()
  return true
}
