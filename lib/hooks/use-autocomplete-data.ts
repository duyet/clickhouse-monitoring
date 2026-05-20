'use client'

import useSWR from 'swr'

import type { AutocompleteItem } from '@/components/agents/mentions/types'

import {
  SLASH_COMMANDS,
  SYSTEM_RESOURCES,
} from '@/components/agents/mentions/constants'
import { apiFetch } from '@/lib/swr/api-fetch'
import { useHostId } from '@/lib/swr/use-host'

interface TableRow {
  database: string
  name: string
  engine: string
  total_rows: string
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await apiFetch(url)
  if (!res.ok)
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export function useAutocompleteData() {
  const hostId = useHostId()

  // Lazy-load tables list (only fetched when hook is mounted = when @ is first used)
  const { data: tablesData, isLoading: tablesLoading } = useSWR<{
    data: TableRow[]
  }>(
    hostId != null ? `/api/v1/tables?hostId=${hostId}&limit=500` : null,
    (url: string) => fetchJson<{ data: TableRow[] }>(url),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const tables: AutocompleteItem[] = (tablesData?.data || []).map((row) => ({
    id: `table-${row.database}-${row.name}`,
    type: 'table' as const,
    label: `${row.database}.${row.name}`,
    description: `${row.engine} · ${row.total_rows || '0'} rows`,
    value: `${row.database}.${row.name}`,
    group: 'Tables',
  }))

  // Skills from agent tools metadata (static, loaded once)
  const { data: skillsData } = useSWR<{
    data: Array<{ name: string; description: string }>
  }>(
    '/api/v1/agent/skills',
    (url: string) =>
      fetchJson<{ data: Array<{ name: string; description: string }> }>(url),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  )

  const skills: AutocompleteItem[] = (skillsData?.data || []).map((skill) => ({
    id: `skill-${skill.name}`,
    type: 'skill' as const,
    label: skill.name,
    description: skill.description,
    value: skill.name,
    group: 'Skills',
  }))

  return {
    tables,
    resources: SYSTEM_RESOURCES,
    skills,
    commands: SLASH_COMMANDS,
    isLoading: tablesLoading,
  }
}
