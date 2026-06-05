import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { userProcessesConfig } from '@/lib/query-config/tables/user-processes'

function UserProcessesPageContent() {
  return <PageLayout queryConfig={userProcessesConfig} title="User Processes" />
}

function UserProcessesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <UserProcessesPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/user-processes')({
  component: UserProcessesPage,
})
