'use client'

import useSWR from 'swr'
import { useHostId } from './use-host'
import { useAuth } from '@/lib/auth/client'

interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  createdAt: Date
  memberCount?: number
  userRole?: string
}

interface Host {
  id: string
  organizationId: string
  name: string
  host: string
  port?: number
  username?: string
  description?: string
  isActive: boolean
  createdAt: Date
  organization?: {
    id: string
    name: string
    slug: string
  }
}

// Simple fetcher for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch data')
  }
  return response.json()
}

export function useHostSelector() {
  const { session, isLoading: authLoading } = useAuth()
  const hostId = useHostId()

  const { data: organizations, isLoading: orgsLoading } = useSWR<
    Organization[]
  >(session ? '/api/organizations' : null, fetcher)

  const { data: hosts = [], isLoading: hostsLoading } = useSWR<Host[]>(
    session && hostId ? `/api/hosts?organizationId=${hostId}` : null,
    fetcher
  )

  const currentOrganization = organizations?.find((org) => org.id === hostId)

  const setCurrentOrganization = async (org: Organization) => {
    // Update the hostId in query params
    const url = new URL(window.location.href)
    url.searchParams.set('host', org.id)
    window.history.replaceState({}, '', url.toString())
  }

  return {
    organizations: organizations || [],
    hosts: hosts || [],
    currentOrganization,
    setCurrentOrganization,
    isLoading: orgsLoading || hostsLoading || authLoading,
  }
}
