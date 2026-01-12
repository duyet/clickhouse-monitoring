'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, Wifi, WifiOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface TestConnectionDialogProps {
  host: {
    id: number
    name: string
    host: string
    port: number
    username?: string
    database?: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTest: (hostId: number) => Promise<void>
}

interface TestResult {
  status: 'success' | 'failed' | 'testing'
  responseTime?: number
  error?: string
  details?: {
    version?: string
    timezone?: string
    uptime?: string
  }
}

export function TestConnectionDialog({
  host,
  open,
  onOpenChange,
  onTest,
}: TestConnectionDialogProps) {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const handleTest = async () => {
    if (!host) return

    setIsTesting(true)
    setTestResult({ status: 'testing' })

    try {
      await onTest(host.id)

      // Mock successful test result for now
      // In a real implementation, this would come from the API response
      setTestResult({
        status: 'success',
        responseTime: Math.floor(Math.random() * 200) + 50,
        details: {
          version: '24.3.2.46',
          timezone: 'UTC',
          uptime: '15 days 3 hours',
        }
      })
    } catch (error: any) {
      setTestResult({
        status: 'failed',
        error: error.message || 'Connection failed',
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (!host) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Server className="mr-2 h-5 w-5" />
            Test Connection: {host.name}
          </DialogTitle>
          <DialogDescription>
            Verify that you can connect to your ClickHouse host.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Connection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Host</span>
                <span>{host.host}:{host.port}</span>
              </div>
              {host.username && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username</span>
                  <span>{host.username}</span>
                </div>
              )}
              {host.database && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database</span>
                  <span>{host.database}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  {testResult.status === 'testing' && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {testResult.status === 'success' && (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  )}
                  {testResult.status === 'failed' && (
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                  )}
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={
                    testResult.status === 'success' ? 'default' :
                    testResult.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {testResult.status === 'success' ? 'Connected' :
                     testResult.status === 'failed' ? 'Failed' : 'Testing...'}
                  </Badge>
                </div>

                {testResult.responseTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Response Time</span>
                    <span>{testResult.responseTime}ms</span>
                  </div>
                )}

                {testResult.error && (
                  <div className="flex items-start space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{testResult.error}</span>
                  </div>
                )}

                {testResult.details && (
                  <div className="border-t pt-2 mt-2">
                    <div className="space-y-1 text-xs">
                      {testResult.details.version && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version</span>
                          <span>{testResult.details.version}</span>
                        </div>
                      )}
                      {testResult.details.timezone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Timezone</span>
                          <span>{testResult.details.timezone}</span>
                        </div>
                      )}
                      {testResult.details.uptime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uptime</span>
                          <span>{testResult.details.uptime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}