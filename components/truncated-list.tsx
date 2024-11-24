'use client'

import { cn } from '@/lib/utils'
import { Children, useState } from 'react'

interface TruncatedListProps {
  items?: number
  children: React.ReactNode[]
  className?: string
}

export function TruncatedList({
  items = 3,
  children,
  className,
}: TruncatedListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isClamped = Children.count(children) > items

  return (
    <div className={cn('transition-all duration-300 ease-in-out', className)}>
      {isExpanded ? children : Children.toArray(children).slice(0, items)}

      {isClamped && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-blue-500 hover:text-blue-700 focus:outline-none"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}
