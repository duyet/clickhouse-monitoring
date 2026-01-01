/**
 * Debounced Input Component
 *
 * An input component with built-in debouncing to optimize performance
 * for search and filter operations. Prevents excessive updates/re-renders
 * while typing by delaying value changes until user stops typing.
 *
 * @example
 * ```tsx
 * <DebouncedInput
 *   placeholder="Search..."
 *   onValueChange={setSearchQuery}
 *   debounceMs={300}
 * />
 * ```
 */

'use client'

import {
  type InputHTMLAttributes,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Input } from '@/components/ui/input'
import { useDebounceWithPending } from '@/lib/hooks'

export interface DebouncedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Callback fired when debounced value changes */
  onValueChange?: (value: string) => void
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number
  /** Show loading indicator while debounce is pending */
  showPendingIndicator?: boolean
  /** Initial value (for uncontrolled mode) */
  defaultValue?: string
  /** Controlled value (for controlled mode) */
  value?: string
}

export const DebouncedInput = memo(function DebouncedInput({
  onValueChange,
  debounceMs = 300,
  showPendingIndicator = false,
  defaultValue = '',
  value: controlledValue,
  className,
  ...props
}: DebouncedInputProps) {
  // Support both controlled and uncontrolled modes
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const inputValue = isControlled ? controlledValue : internalValue

  const { debouncedValue, isPending } = useDebounceWithPending(
    inputValue,
    debounceMs
  )

  // Store callback in ref to avoid triggering effect when callback reference changes
  // This prevents infinite loops when parent doesn't memoize onValueChange
  const onValueChangeRef = useRef(onValueChange)
  useEffect(() => {
    onValueChangeRef.current = onValueChange
  })

  // Track if this is the initial mount to avoid calling callback with initial value
  const isInitialMount = useRef(true)

  // Call onValueChange when debounced value updates (not when callback changes)
  useEffect(() => {
    // Skip calling onValueChange on initial mount to prevent infinite loops
    // The parent already knows the initial value
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    onValueChangeRef.current?.(debouncedValue)
  }, [debouncedValue])

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      if (isControlled) {
        // In controlled mode, parent manages state
        onValueChange?.(newValue)
      } else {
        // In uncontrolled mode, manage internal state
        setInternalValue(newValue)
      }
    },
    [isControlled, onValueChange]
  )

  return (
    <div className="relative" role="search">
      <Input
        {...props}
        value={inputValue}
        onChange={handleChange}
        className={className}
        data-pending={isPending || undefined}
        aria-busy={isPending}
        aria-describedby={isPending ? 'search-pending' : undefined}
      />
      {showPendingIndicator && isPending && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2"
          role="status"
          aria-label="Searching"
          id="search-pending"
        >
          <div className="flex h-4 w-4 items-center justify-center">
            <div
              className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"
              aria-hidden="true"
            />
          </div>
          <span className="sr-only">Searching...</span>
        </div>
      )}
    </div>
  )
})
