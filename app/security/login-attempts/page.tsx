'use client'

import { createPage } from '@/lib/create-page'
import { loginAttemptsConfig } from '@/lib/query-config/security/login-attempts'

export default createPage({
  queryConfig: loginAttemptsConfig,
  title: 'Login Attempts',
})
