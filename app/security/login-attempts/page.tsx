'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { loginAttemptsConfig } from '@/lib/query-config/security/login-attempts'

function LoginAttemptsContent() {
  return <PageLayout queryConfig={loginAttemptsConfig} title="Login Attempts" />
}

export default function LoginAttemptsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LoginAttemptsContent />
    </Suspense>
  )
}
