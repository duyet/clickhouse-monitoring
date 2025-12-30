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

import { Input } from '@/components/ui/input'
import { useDebounceWithPending } from '@/lib/hooks'
import { type InputHTMLAttributes, useEffect, useState } from 'react'

export interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
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

export function DebouncedInput({
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

  const { debouncedValue, isPending } = useDebounceWithPending(inputValue, debounceMs)

  // Call onValueChange when debounced value updates
  useEffect(() => {
    onValueChange?.(debouncedValue)
  }, [debouncedValue, onValueChange])

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (isControlled) {
      // In controlled mode, parent manages state
      onValueChange?.(newValue)
    } else {
      // In uncontrolled mode, manage internal state
      setInternalValue(newValue)
    }
  }

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
            <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" aria-hidden="true" />
          </div>
          <span className="sr-only">Searching...</span>
        </div>
      )}
    </div>
  )
}
