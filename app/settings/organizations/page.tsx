'use client'

import { Suspense } from 'react'
import { OrganizationsContent } from '@/components/organizations/organizations-content'

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrganizationsContent />
    </Suspense>
  )
}