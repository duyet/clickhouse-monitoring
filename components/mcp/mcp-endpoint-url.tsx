'use client'

import { Globe } from 'lucide-react'

import { CopyButton } from './copy-button'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

export function McpEndpointUrl() {
  const [endpointUrl, setEndpointUrl] = useState('')

  useEffect(() => {
    setEndpointUrl(`${window.location.origin}/api/mcp`)
  }, [])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
        <code className="flex-1 min-w-0 rounded-md bg-muted px-3 py-2 text-sm font-mono truncate block">
          {endpointUrl || 'Loading...'}
        </code>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary" className="text-xs">
          Streamable HTTP
        </Badge>
        {endpointUrl && <CopyButton text={endpointUrl} />}
      </div>
    </div>
  )
}
