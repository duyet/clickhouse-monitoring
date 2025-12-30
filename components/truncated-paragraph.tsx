'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface TruncatedParagraphProps {
  lineClamp?: number
  children: React.ReactNode
  className?: string
}

export const TruncatedParagraph = memo(function TruncatedParagraph({
  lineClamp = 2,
  children,
  className,
}: TruncatedParagraphProps) {
  const contentRef = useRef<HTMLParagraphElement>(null)
  const [isClamped, setClamped] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Function that should be called on window resize
    function handleResize() {
      if (contentRef?.current) {
        setClamped(
          contentRef.current.scrollHeight > contentRef.current.clientHeight
        )
      }
    }

    handleResize()

    // Add event listener to window resize
    window.addEventListener('resize', handleResize)

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, []) // Empty array ensures that it would only run on mount

  return (
    <div>
      <p
        data-expanded={isExpanded ? 'true' : 'false'}
        className={cn(
          'text-sm leading-normal',
          isExpanded ? '' : `line-clamp-${lineClamp}`,
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
})
