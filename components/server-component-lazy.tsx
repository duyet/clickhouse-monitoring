'use client'

import { ReactNode, Suspense } from 'react'

import { LoadingIcon } from '@/components/loading-icon'

export function ServerComponentLazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingIcon />}>{children}</Suspense>
}
