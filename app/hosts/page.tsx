'use client'

import { Suspense } from 'react'
import { useHostSelector } from '@/components/hosts/host-selector'
import { HostsList } from '@/components/hosts/hosts-list'
import { OrganizationsList } from '@/components/organizations/organizations-list'

export default function HostsPage() {
  return (
    <div className="flex flex-col h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <HostsPageContent />
      </Suspense>
    </div>
  )
}

function HostsPageContent() {
  const {
    currentOrganization,
    setCurrentOrganization,
    organizations,
    isLoading,
  } = useHostSelector()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex h-full">
        {/* Organizations sidebar */}
        <div className="w-80 border-r bg-gray-50">
          <OrganizationsList
            organizations={organizations}
            currentOrganization={currentOrganization}
            onSelect={setCurrentOrganization}
          />
        </div>

        {/* Hosts main content */}
        <div className="flex-1">
          <HostsList organizationId={currentOrganization?.id} />
        </div>
      </div>
    </div>
  )
}
