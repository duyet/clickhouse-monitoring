'use client'

import { Globe, Lock, Zap } from 'lucide-react'

import { McpEndpointUrl } from '@/components/mcp/mcp-endpoint-url'
import { McpExamplePrompts } from '@/components/mcp/mcp-example-prompts'
import { McpPlayground } from '@/components/mcp/mcp-playground'
import { McpSetupGuides } from '@/components/mcp/mcp-setup-guides'
import { McpToolsDocs } from '@/components/mcp/mcp-tools-docs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function FeaturePill({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="text-muted-foreground/70">{icon}</span>
      {label}
    </div>
  )
}

export default function McpPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">MCP Server</h1>
          <Badge variant="secondary" className="text-xs">
            Model Context Protocol
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Connect AI assistants like Claude, Cursor, and other MCP-compatible
          clients directly to your ClickHouse cluster. Query data, explore
          schemas, and investigate performance — all through natural language.
        </p>
        <div className="flex flex-wrap gap-4">
          <FeaturePill
            icon={<Globe className="h-3.5 w-3.5" />}
            label="Streamable HTTP"
          />
          <FeaturePill
            icon={<Lock className="h-3.5 w-3.5" />}
            label="Read-only access"
          />
          <FeaturePill
            icon={<Zap className="h-3.5 w-3.5" />}
            label="8 tools available"
          />
        </div>
      </div>

      {/* Endpoint URL — always visible */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Endpoint URL
            </p>
            <McpEndpointUrl />
          </div>
        </CardContent>
      </Card>

      {/* Main tabbed content */}
      <Tabs defaultValue="setup">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="setup" className="text-xs flex-1 sm:flex-none">
            Setup Guides
          </TabsTrigger>
          <TabsTrigger value="tools" className="text-xs flex-1 sm:flex-none">
            Tools
          </TabsTrigger>
          <TabsTrigger
            value="playground"
            className="text-xs flex-1 sm:flex-none"
          >
            Playground
          </TabsTrigger>
          <TabsTrigger value="prompts" className="text-xs flex-1 sm:flex-none">
            Example Prompts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-4">
          <McpSetupGuides />
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <McpToolsDocs />
        </TabsContent>

        <TabsContent value="playground" className="mt-4">
          <McpPlayground />
        </TabsContent>

        <TabsContent value="prompts" className="mt-4">
          <McpExamplePrompts />
        </TabsContent>
      </Tabs>
    </div>
  )
}
