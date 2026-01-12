'use client'

import { Suspense } from 'react'
import { HostsContent } from '@/components/hosts/hosts-content'

export default function HostsPage() {
  return (
    <Suspense fallback={<div>Loading hosts...</div>}>
      <HostsContent />
    </Suspense>
  )
}