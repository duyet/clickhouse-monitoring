'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

interface TruncatedParagraphProps {
  lineClamp?: number
  children: React.ReactNode
  className?: string
}

export function TruncatedParagraph({
  lineClamp = 2,
  children,
  className,
}: TruncatedParagraphProps) {
  const contentRef = useRef<HTMLParagraphElement>(null)
  const [isClamped, setClamped] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Recalculate clamping when children change
  useEffect(() => {
    function handleResize() {
      if (contentRef && contentRef.current) {
        setClamped(
          contentRef.current.scrollHeight > contentRef.current.clientHeight
        )
      }
    }

    handleResize()
  }, [children]) // Re-run when children change to recalculate clamping

  // Separate effect for window resize listener to prevent re-adding on every children change
  useEffect(() => {
    function handleResize() {
      if (contentRef && contentRef.current) {
        setClamped(
          contentRef.current.scrollHeight > contentRef.current.clientHeight
        )
      }
    }

    // Add event listener to window resize
    window.addEventListener('resize', handleResize)

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, []) // Empty dependency array - only add listener once

  // Map lineClamp value to pre-defined Tailwind classes
  const lineClamClasses: Record<number, string> = {
    1: 'line-clamp-1',
    2: 'line-clamp-2',
    3: 'line-clamp-3',
    4: 'line-clamp-4',
    5: 'line-clamp-5',
    6: 'line-clamp-6',
  }

  return (
    <div>
      <p
        data-expanded={isExpanded ? 'true' : 'false'}
        className={cn(
          'text-sm leading-normal',
          isExpanded ? '' : lineClamClasses[lineClamp] || 'line-clamp-2',
          'transition-all duration-300 ease-in-out',
          className
        )}
        ref={contentRef}
      >
        {children}
      </p>

      {isClamped && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-blue-500 hover:text-blue-700 focus:outline-hidden"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}
