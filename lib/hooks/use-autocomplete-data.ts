'use client'

import useSWR from 'swr'

import type { AutocompleteItem } from '@/components/agents/mentions/types'

import {
  SLASH_COMMANDS,
  SYSTEM_RESOURCES,
} from '@/components/agents/mentions/constants'
import { useHostId } from '@/lib/swr/use-host'

interface TableRow {
  database: string
  name: string
  engine: string
  total_rows: string
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json() as Promise<T>
}

export function useAutocompleteData() {
  const hostId = useHostId()

  // Lazy-load tables list (only fetched when hook is mounted = when @ is first used)
  const { data: tablesData, isLoading: tablesLoading } = useSWR<{
    data: TableRow[]
  }>(
    `/api/v1/data?query=${encodeURIComponent("SELECT database, name, engine, toString(total_rows) as total_rows FROM system.tables WHERE database != 'INFORMATION_SCHEMA' AND database != 'information_schema' ORDER BY database, name LIMIT 500")}&hostId=${hostId}`,
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
