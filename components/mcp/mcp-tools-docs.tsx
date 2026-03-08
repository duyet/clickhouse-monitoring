'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'

import { CodeBlock } from './copy-button'
import { MCP_TOOLS } from './mcp-tools-data'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function ParamBadge({ required }: { required: boolean }) {
  return (
    <Badge
      variant={required ? 'default' : 'secondary'}
      className="text-[10px] px-1.5 py-0"
    >
      {required ? 'required' : 'optional'}
    </Badge>
  )
}

function ToolCard({ tool }: { tool: (typeof MCP_TOOLS)[number] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <code className="text-sm font-semibold text-primary shrink-0">
            {tool.name}
          </code>
          <span className="text-xs text-muted-foreground truncate hidden sm:block">
            {tool.description}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 hidden sm:flex"
          >
            {tool.params.length} param{tool.params.length !== 1 ? 's' : ''}
          </Badge>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
          <p className="text-sm text-muted-foreground sm:hidden">
            {tool.description}
          </p>

          {/* Parameters */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Parameters
            </h5>
            <div className="space-y-2">
              {tool.params.map((param) => (
                <div
                  key={param.name}
                  className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-xs rounded-md bg-background border px-3 py-2"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <code className="font-semibold">{param.name}</code>
                    <span className="text-muted-foreground">{param.type}</span>
                    <ParamBadge required={param.required} />
                  </div>
                  <div className="text-muted-foreground flex-1">
                    {param.description}
                    {param.default !== undefined && (
                      <span className="ml-1">
                        Default:{' '}
                        <code className="text-foreground">
                          {String(param.default)}
                        </code>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example Response */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Example Response
            </h5>
            <CodeBlock>{tool.exampleResponse}</CodeBlock>
          </div>
        </div>
      )}
    </div>
  )
}

export function McpToolsDocs() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Available Tools ({MCP_TOOLS.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {MCP_TOOLS.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </CardContent>
    </Card>
  )
}
