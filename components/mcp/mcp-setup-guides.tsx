'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'

import { CodeBlock } from './copy-button'
import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface SetupGuide {
  id: string
  name: string
  description: string
  steps: Array<
    | { type: 'text'; content: string }
    | { type: 'code'; content: string; copyText?: string }
  >
}

function GuideSection({ guide }: { guide: SetupGuide }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="space-y-0.5">
          <div className="text-sm font-medium">{guide.name}</div>
          <div className="text-xs text-muted-foreground">
            {guide.description}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-3" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-3" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-3 bg-muted/20">
          {guide.steps.map((step, i) =>
            step.type === 'text' ? (
              <p key={i} className="text-xs text-muted-foreground">
                {step.content}
              </p>
            ) : (
              <CodeBlock key={i} copyText={step.copyText}>
                {step.content}
              </CodeBlock>
            )
          )}
        </div>
      )}
    </div>
  )
}

export function McpSetupGuides() {
  const [endpointUrl, setEndpointUrl] = useState(
    'https://your-deployment.example.com/api/mcp'
  )

  useEffect(() => {
    setEndpointUrl(`${window.location.origin}/api/mcp`)
  }, [])

  const guides: SetupGuide[] = useMemo(
    () => [
      {
        id: 'claude-desktop',
        name: 'Claude Desktop',
        description:
          'Add to claude_desktop_config.json to connect Claude Desktop',
        steps: [
          {
            type: 'text',
            content:
              'Open your Claude Desktop config file. On macOS it is at ~/Library/Application Support/Claude/claude_desktop_config.json, on Windows at %APPDATA%/Claude/claude_desktop_config.json.',
          },
          {
            type: 'text',
            content: 'Add the following to your mcpServers section:',
          },
          {
            type: 'code',
            content: JSON.stringify(
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
            copyText: JSON.stringify(
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
          },
          {
            type: 'text',
            content: 'Restart Claude Desktop to apply the changes.',
          },
        ],
      },
      {
        id: 'claude-code',
        name: 'Claude Code',
        description: 'Add via the claude mcp add command in your terminal',
        steps: [
          {
            type: 'text',
            content:
              'Run the following command in your terminal to add the MCP server to Claude Code:',
          },
          {
            type: 'code',
            content: `claude mcp add --transport http clickhouse-monitor ${endpointUrl}`,
            copyText: `claude mcp add --transport http clickhouse-monitor ${endpointUrl}`,
          },
          {
            type: 'text',
            content:
              'You can verify the server was added by running: claude mcp list',
          },
          {
            type: 'code',
            content: 'claude mcp list',
            copyText: 'claude mcp list',
          },
        ],
      },
      {
        id: 'cursor',
        name: 'Cursor',
        description: 'Add via Settings > MCP in the Cursor IDE',
        steps: [
          {
            type: 'text',
            content:
              'Open Cursor Settings (Cmd+, on macOS), navigate to Features > MCP, and click "Add MCP Server".',
          },
          {
            type: 'text',
            content:
              'Alternatively, add the following to your .cursor/mcp.json file:',
          },
          {
            type: 'code',
            content: JSON.stringify(
              {
                mcpServers: {
                  'clickhouse-monitor': {
                    url: endpointUrl,
                    transport: 'http',
                  },
                },
              },
              null,
              2
            ),
            copyText: JSON.stringify(
              {
                mcpServers: {
                  'clickhouse-monitor': {
                    url: endpointUrl,
                    transport: 'http',
                  },
                },
              },
              null,
              2
            ),
          },
        ],
      },
      {
        id: 'other',
        name: 'Other MCP Clients',
        description:
          'Any MCP-compatible client using Streamable HTTP transport',
        steps: [
          {
            type: 'text',
            content:
              'This server uses the Streamable HTTP transport (stateless mode). Point your MCP client to the endpoint URL:',
          },
          {
            type: 'code',
            content: endpointUrl,
            copyText: endpointUrl,
          },
          {
            type: 'text',
            content:
              'You can test connectivity with curl by listing available tools:',
          },
          {
            type: 'code',
            content: `curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`,
            copyText: `curl -X POST ${endpointUrl} -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`,
          },
        ],
      },
    ],
    [endpointUrl]
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Setup Guides</CardTitle>
        <CardDescription className="text-xs">
          Connect your AI assistant to this ClickHouse Monitor instance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {guides.map((guide) => (
          <GuideSection key={guide.id} guide={guide} />
        ))}
      </CardContent>
    </Card>
  )
}
