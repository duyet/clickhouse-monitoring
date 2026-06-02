'use client'

/**
 * MCP Config Panel
 *
 * Shows the status of Model Context Protocol servers connected to the agent:
 *   - Built-in clickhouse-monitor server (always present)
 *   - User-added custom servers (UI-only; backend wiring is TODO)
 *
 * Follows the assistant-ui MCP config pattern:
 *   https://www.assistant-ui.com/docs/ui/mcp-config
 *
 * Per-server enable/disable toggles and "Connect new server" are UI-only.
 * TODO: wire toggles and custom-server form to agent runtime MCP config.
 */

import { PlusIcon, WrenchIcon } from 'lucide-react'

import type { McpServer } from './mcp-types'

import { McpToolsResourcesDialog } from './mcp-tools-resources-dialog'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

// Re-exported for existing consumers; canonical definition lives in mcp-types.ts.
export type { McpServer }

// ---------------------------------------------------------------------------
// Built-in server definition (always present)
// ---------------------------------------------------------------------------

const BUILTIN_SERVER: McpServer = {
  id: 'clickhouse-monitor',
  name: 'clickhouse-monitor',
  endpoint: '/api/mcp',
  toolCount: 14,
  resourceCount: 2,
  version: 'v1.0.0',
  builtin: true,
  enabled: true,
  status: 'connected',
}

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: McpServer['status'] }) {
  if (status === 'connected') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Connected
      </span>
    )
  }
  if (status === 'connecting') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
        <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
        Connecting
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-destructive">
        <span className="size-1.5 rounded-full bg-destructive" />
        Error
      </span>
    )
  }
  return <span className="text-muted-foreground text-[10px]">Unconfigured</span>
}

// ---------------------------------------------------------------------------
// Single server row
// ---------------------------------------------------------------------------

function McpServerRow({
  server,
  onToggle,
  onViewDetails,
}: {
  server: McpServer
  onToggle: (id: string, next: boolean) => void
  onViewDetails: (server: McpServer) => void
}) {
  return (
    <div className="flex items-center gap-2 py-2 pr-3 pl-2">
      {/* Icon */}
      <div className="bg-muted inline-flex size-7 shrink-0 items-center justify-center rounded-md">
        <WrenchIcon className="text-foreground size-3.5" />
      </div>

      {/* Info — clickable region; stopPropagation not needed since Toggle is a sibling */}
      <button
        type="button"
        className="hover:bg-muted/40 -mx-1 min-w-0 flex-1 cursor-pointer rounded px-1 py-0.5 text-left transition-colors"
        onClick={() => onViewDetails(server)}
        aria-label={`View tools and resources for ${server.name}`}
      >
        <div className="flex items-center gap-1.5">
          <span className="truncate font-mono text-[12.5px]">
            {server.name}
          </span>
          {server.version && (
            <Badge
              variant="outline"
              className="h-4 shrink-0 px-1.5 text-[10px]"
            >
              {server.version}
            </Badge>
          )}
        </div>
        <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[10.5px] tabular-nums">
          <span>{server.toolCount} tools</span>
          {server.resourceCount !== undefined && (
            <>
              <span className="text-border">·</span>
              <span>{server.resourceCount} resources</span>
            </>
          )}
          <span className="text-border">·</span>
          <StatusBadge status={server.status} />
        </div>
      </button>

      {/* Toggle — separate from the clickable info region */}
      <Switch
        checked={server.enabled}
        onCheckedChange={(next) => onToggle(server.id, next)}
        className="shrink-0"
        aria-label={`Toggle ${server.name}`}
        // TODO: wire to agent runtime MCP config to actually enable/disable the server
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// "Connect new server" form (UI-only)
// ---------------------------------------------------------------------------

function AddServerForm({ onCancel }: { onCancel: () => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  const inputClass = cn(
    'bg-background border-input h-8 w-full rounded-md border px-3 text-[12px]',
    'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
  )

  return (
    <div className="border-border mt-2 space-y-2 rounded-md border p-2.5">
      <p className="text-muted-foreground text-[10.5px] font-medium tracking-wide uppercase">
        New server
      </p>
      <input
        type="text"
        placeholder="Server name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
      />
      <input
        type="url"
        placeholder="Endpoint URL (https://…)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className={inputClass}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="h-7 flex-1 text-[11.5px]"
          disabled
          // TODO: implement server registration via agent runtime MCP config
          title="Backend wiring not yet implemented"
        >
          Connect
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 flex-1 text-[11.5px]"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Panel root
// ---------------------------------------------------------------------------

export interface AgentMcpPanelProps {
  /**
   * Overall MCP status.
   * TODO: derive from a real useMcpStatus() hook once backend wiring is done.
   */
  status?: 'configured' | 'unconfigured'
  /**
   * Additional servers beyond the built-in one.
   * TODO: read from agent runtime MCP config.
   */
  extraServers?: McpServer[]
}

export function AgentMcpPanel({
  status = 'configured',
  extraServers = [],
}: AgentMcpPanelProps) {
  const [servers, setServers] = useState<McpServer[]>([
    BUILTIN_SERVER,
    ...extraServers,
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedServer, setSelectedServer] = useState<McpServer | null>(null)

  const handleToggle = (id: string, next: boolean) => {
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: next } : s))
    )
    // TODO: persist toggle state via agent runtime MCP config
  }

  const activeCount = servers.filter((s) => s.enabled).length

  return (
    <div className="flex flex-col gap-2">
      {/* Tools/resources detail dialog */}
      <McpToolsResourcesDialog
        server={selectedServer}
        open={selectedServer !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedServer(null)
        }}
      />

      {/* Summary row */}
      <div className="text-muted-foreground flex items-center justify-between text-[10.5px]">
        <span>
          <span className="text-foreground font-medium">{activeCount}</span>/
          {servers.length} active
        </span>
        {status === 'configured' ? (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Configured
          </span>
        ) : (
          <span className="text-muted-foreground flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
            Unconfigured
          </span>
        )}
      </div>

      {/* Server list */}
      <div className="border-border divide-border divide-y rounded-md border">
        {servers.map((server) => (
          <McpServerRow
            key={server.id}
            server={server}
            onToggle={handleToggle}
            onViewDetails={setSelectedServer}
          />
        ))}
      </div>

      {/* Add server form / button */}
      {showAddForm ? (
        <AddServerForm onCancel={() => setShowAddForm(false)} />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 h-8 w-full justify-center gap-1.5 text-[11.5px]"
          onClick={() => setShowAddForm(true)}
        >
          <PlusIcon className="size-3" />
          Connect new server
        </Button>
      )}
    </div>
  )
}
