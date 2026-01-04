'use client'

import { Check, Copy } from 'lucide-react'
import useSWR from 'swr'

import { useExplorerState } from '../hooks/use-explorer-state'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostId } from '@/lib/swr/use-host'

interface DdlRow {
  create_table_query: string
}

interface ApiResponse<T> {
  data: T
  metadata?: Record<string, unknown>
}

const fetcher = (url: string): Promise<ApiResponse<DdlRow[]>> =>
  fetch(url).then((res) => res.json())

/**
 * Simple SQL formatter for ClickHouse DDL statements.
 * Adds line breaks and indentation for readability.
 */
function formatSql(sql: string): string {
  if (!sql) return sql

  // Keywords that should start on a new line (no indent)
  const topLevelKeywords = [
    'CREATE TABLE',
    'CREATE MATERIALIZED VIEW',
    'CREATE VIEW',
    'CREATE DICTIONARY',
    'ENGINE',
    'ORDER BY',
    'PARTITION BY',
    'PRIMARY KEY',
    'SAMPLE BY',
    'TTL',
    'SETTINGS',
    'COMMENT',
  ]

  // Keywords that should start on a new line (with indent)
  const indentedKeywords = ['TO', 'AS SELECT', 'AS']

  let formatted = sql.trim()

  // Add newline before top-level keywords
  topLevelKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\s+(${keyword})\\b`, 'gi')
    formatted = formatted.replace(regex, `\n$1`)
  })

  // Add newline and indent before certain keywords
  indentedKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\s+(${keyword})\\b`, 'gi')
    formatted = formatted.replace(regex, `\n  $1`)
  })

  // Format column definitions - add newline after opening paren in CREATE TABLE
  formatted = formatted.replace(/\(\s*`/g, '(\n  `')
  formatted = formatted.replace(/,\s*`/g, ',\n  `')

  // Close the column list on its own line
  formatted = formatted.replace(/`\s*\)\s*(ENGINE)/gi, '`\n)\n$1')

  return formatted
}

export function DdlTab() {
  const hostId = useHostId()
  const { database, table } = useExplorerState()
  const [copied, setCopied] = useState(false)

  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse<DdlRow[]>>(
    database && table
      ? `/api/v1/explorer/ddl?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}`
      : null,
    fetcher
  )

  const ddl = response?.data?.[0]?.create_table_query

  const handleCopy = async () => {
    if (ddl) {
      await navigator.clipboard.writeText(ddl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!database || !table) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table DDL</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table DDL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            Failed to load DDL: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  const formattedDdl = ddl ? formatSql(ddl) : ''

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Table DDL</CardTitle>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="mr-2 size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 size-4" />
              Copy
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted p-4 font-mono text-sm leading-relaxed">
          <code>{formattedDdl}</code>
        </pre>
      </CardContent>
    </Card>
  )
}
