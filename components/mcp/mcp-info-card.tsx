'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Copy, Globe, Terminal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const MCP_TOOLS = [
  {
    name: 'query',
    description: 'Execute a read-only SQL query against ClickHouse',
  },
  {
    name: 'list_databases',
    description: 'List all databases in the ClickHouse cluster',
  },
  {
    name: 'list_tables',
    description: 'List tables in a specific database with metadata',
  },
  {
    name: 'describe_table',
    description: 'Show column names, types, and comments for a table',
  },
  {
    name: 'server_info',
    description: 'Get ClickHouse server version and uptime',
  },
  {
    name: 'running_queries',
    description: 'List currently executing queries with progress',
  },
  {
    name: 'slow_queries',
    description: 'Find slowest queries from the query log',
  },
  {
    name: 'table_stats',
    description: 'Get row counts, sizes, and part info for a table',
  },
] as const

function CopyButton({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-7 px-2', className)}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

function CodeBlock({
  children,
  copyText,
}: {
  children: string
  copyText?: string
}) {
  return (
    <div className="relative group">
      <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
        <code>{children}</code>
      </pre>
      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={copyText ?? children} />
      </div>
    </div>
  )
}

export function McpInfoCard() {
  const [endpointUrl, setEndpointUrl] = useState('')

  useEffect(() => {
    setEndpointUrl(window.location.origin + '/api/mcp')
  }, [])

  const claudeDesktopConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            'clickhouse-monitor': {
              url: endpointUrl,
            },
          },
        },
        null,
        2
      ),
    [endpointUrl]
  )

  const curlExample = `curl -X POST ${endpointUrl || 'http://localhost:3000/api/mcp'} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4" />
          MCP Server
        </CardTitle>
        <CardDescription>
          Connect AI assistants to your ClickHouse cluster via the Model
          Context Protocol (MCP).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Endpoint URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Endpoint URL</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono">
              {endpointUrl || '...'}
            </code>
            {endpointUrl && <CopyButton text={endpointUrl} />}
          </div>
        </div>

        {/* Connection Instructions */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Setup Instructions</h4>

          {/* Claude Desktop */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Claude Desktop
            </p>
            <p className="text-xs text-muted-foreground">
              Add to{' '}
              <code className="text-[11px]">claude_desktop_config.json</code>:
            </p>
            <CodeBlock copyText={claudeDesktopConfig}>
              {claudeDesktopConfig}
            </CodeBlock>
          </div>

          {/* Cursor */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Cursor</p>
            <p className="text-xs text-muted-foreground">
              Go to{' '}
              <code className="text-[11px]">
                Settings &gt; MCP &gt; Add Server
              </code>{' '}
              and enter the endpoint URL above.
            </p>
          </div>

          {/* Generic / curl */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Terminal className="h-3 w-3" />
              Test with curl
            </p>
            <CodeBlock>{curlExample}</CodeBlock>
          </div>
        </div>

        {/* Available Tools */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Available Tools ({MCP_TOOLS.length})
          </h4>
          <div className="grid gap-2">
            {MCP_TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="flex items-start gap-3 rounded-md border px-3 py-2"
              >
                <code className="text-xs font-semibold whitespace-nowrap mt-0.5">
                  {tool.name}
                </code>
                <span className="text-xs text-muted-foreground">
                  {tool.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
