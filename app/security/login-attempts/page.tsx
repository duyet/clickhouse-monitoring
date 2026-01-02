'use client'

import { PageLayout } from '@/components/layout/query-page'
import { loginAttemptsConfig } from '@/lib/query-config/security/login-attempts'

export default function LoginAttemptsPage() {
  return (
    <PageLayout
      queryConfig={loginAttemptsConfig}
      title="Login Attempts"
    />
  )
}
