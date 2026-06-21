'use client'

/**
 * MCP Config Panel
 *
 * Shows the status of Model Context Protocol servers connected to the agent:
 *   - Built-in clickhouse-monitor server (always present)
 *   - User-added custom servers
 *
 * Follows the assistant-ui MCP config pattern:
 *   https://www.assistant-ui.com/docs/ui/mcp-config
 *
 * Per-server enable/disable toggles and "Connect new server" persist to
 * localStorage via {@link useMcpConfig}, mirroring how individual MCP tool
 * selections are stored by `useToolConfig`.
 */

import { PlusIcon, Trash2Icon, WrenchIcon } from 'lucide-react'

import type { McpServer } from './mcp-types'

import { McpToolsResourcesDialog } from './mcp-tools-resources-dialog'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toMcpServers, useMcpConfig } from '@/lib/hooks/use-mcp-config'
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
  onRemove,
}: {
  server: McpServer
  onToggle: (id: string, next: boolean) => void
  onViewDetails: (server: McpServer) => void
  onRemove?: (id: string) => void
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

      {/* Remove — only for user-added custom servers */}
      {!server.builtin && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-7 shrink-0"
          onClick={() => onRemove(server.id)}
          aria-label={`Remove ${server.name}`}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      )}

      {/* Toggle — separate from the clickable info region */}
      <Switch
        checked={server.enabled}
        onCheckedChange={(next) => onToggle(server.id, next)}
        className="shrink-0"
        aria-label={`Toggle ${server.name}`}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// "Connect new server" form (UI-only)
// ---------------------------------------------------------------------------

function AddServerForm({
  onCancel,
  onAdd,
}: {
  onCancel: () => void
  onAdd: (server: { name: string; endpoint: string }) => void
}) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  const trimmedName = name.trim()
  const trimmedUrl = url.trim()
  const canSubmit = trimmedName.length > 0 && trimmedUrl.length > 0

  const inputClass = cn(
    'bg-background border-input h-8 w-full rounded-md border px-3 text-[12px]',
    'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
  )

  const handleSubmit = () => {
    if (!canSubmit) return
    onAdd({ name: trimmedName, endpoint: trimmedUrl })
  }

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
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
        className={inputClass}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="h-7 flex-1 text-[11.5px]"
          disabled={!canSubmit}
          onClick={handleSubmit}
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
  /** Overall MCP status. */
  status?: 'configured' | 'unconfigured'
}

export function AgentMcpPanel({ status = 'configured' }: AgentMcpPanelProps) {
  const {
    customServers,
    isServerEnabled,
    setServerEnabled,
    addServer,
    removeServer,
  } = useMcpConfig()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedServer, setSelectedServer] = useState<McpServer | null>(null)

  // Built-in server first, then user-added custom servers from localStorage.
  const servers: McpServer[] = [
    { ...BUILTIN_SERVER, enabled: isServerEnabled(BUILTIN_SERVER.id) },
    ...toMcpServers(customServers, isServerEnabled),
  ]

  const handleToggle = (id: string, next: boolean) => {
    setServerEnabled(id, next)
  }

  const handleAddServer = (server: { name: string; endpoint: string }) => {
    addServer(server)
    setShowAddForm(false)
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
            onRemove={removeServer}
          />
        ))}
      </div>

      {/* Add server form / button */}
      {showAddForm ? (
        <AddServerForm
          onCancel={() => setShowAddForm(false)}
          onAdd={handleAddServer}
        />
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
