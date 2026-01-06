import { Suspense } from 'react'
import { PageSkeleton } from '@/components/skeletons'

/**
 * Template component - wraps each page and re-renders on navigation
 *
 * Unlike layout.tsx which persists across navigations, template.tsx
 * creates a new instance for each page navigation, allowing us to
 * show loading states during transitions.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#templates
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}
