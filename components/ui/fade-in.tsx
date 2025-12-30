/**
 * Fade-in wrapper component
 *
 * Provides smooth fade-in animation for content that replaces skeletons.
 *
 * @example
 * ```tsx
 * <FadeIn>
 *   <YourContent />
 * </FadeIn>
 * ```
 */

import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'
import { memo } from 'react'

interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
  /** Duration in ms (default: 200) */
  duration?: number
  /** Delay in ms before animation starts */
  delay?: number
  /** Whether to also scale in (adds subtle scale effect) */
  scale?: boolean
}

export const FadeIn = memo(function FadeIn({
  children,
  className,
  duration = 200,
  delay = 0,
  scale = false,
  ...props
}: FadeInProps) {
  const animationClass = scale
    ? 'animate-[scale-in_0.2s_ease-out]'
    : 'animate-[fade-in_0.2s_ease-out]'
  const style = {
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`,
    animationFillMode: 'both' as const,
  }

  return (
    <div
      className={cn(animationClass, 'motion-reduce:animate-none', className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * Staggered children fade-in
 *
 * Fades in children with increasing delays for a cascading effect.
 *
 * @example
 * ```tsx
 * <StaggeredFadeIn stagger={50}>
 *   <Item1 />
 *   <Item2 />
 *   <Item3 />
 * </StaggeredFadeIn>
 * ```
 */
interface StaggeredFadeInProps extends HTMLAttributes<HTMLDivElement> {
  /** Delay between each child in ms (default: 50) */
  stagger?: number
  /** Base duration in ms (default: 200) */
  duration?: number
}

export const StaggeredFadeIn = memo(function StaggeredFadeIn({
  children,
  className,
  stagger = 50,
  duration = 200,
  ...props
}: StaggeredFadeInProps) {
  const childrenArray = Array.isArray(children) ? children : [children]

  return (
    <div className={className} {...props}>
      {childrenArray.map((child, index) => {
        if (child === null || child === undefined) return null
        const delay = index * stagger
        const style = {
          animationDuration: `${duration}ms`,
          animationDelay: `${delay}ms`,
          animationFillMode: 'both' as const,
        }
        return (
          <div key={index} className="animate-fade-in motion-reduce:animate-none" style={style}>
            {child}
          </div>
        )
      })}
    </div>
  )
})
