'use client'

import { CheckCircle2, Loader2, XCircle, Zap } from 'lucide-react'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'

interface TestConnectionButtonProps {
  /**
   * ClickHouse host URL
   */
  host: string
  /**
   * ClickHouse username
   */
  username: string
  /**
   * ClickHouse password
   */
  password: string
  /**
   * Callback with test result
   */
  onResult?: (result: {
    success: boolean
    error?: string
    selfSigned?: boolean
  }) => void
  /**
   * Whether the button is disabled
   */
  disabled?: boolean
}

/**
 * Test Connection Button Component
 *
 * Tests the connection to a ClickHouse host and reports the result.
 * Detects self-signed certificate errors and reports them separately.
 */
export function TestConnectionButton({
  host,
  username,
  password,
  onResult,
  disabled = false,
}: TestConnectionButtonProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null)

  const handleTest = useCallback(async () => {
    if (!host) return

    setIsTesting(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/v1/hosts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, username, password }),
      })

      const data = (await response.json()) as {
        success?: boolean
        error?: string
        selfSigned?: boolean
      }

      if (response.ok && data.success) {
        setLastResult('success')
        onResult?.({ success: true })
      } else {
        setLastResult('error')
        onResult?.({
          success: false,
          error: data.error || 'Connection test failed',
          selfSigned: data.selfSigned,
        })
      }
    } catch (error) {
      setLastResult('error')
      onResult?.({
        success: false,
        error:
          error instanceof Error ? error.message : 'Connection test failed',
      })
    } finally {
      setIsTesting(false)
    }
  }, [host, username, password, onResult])

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleTest}
      disabled={disabled || isTesting || !host}
      className="w-full"
    >
      {isTesting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Testing Connection...
        </>
      ) : lastResult === 'success' ? (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
          Connection Successful
        </>
      ) : lastResult === 'error' ? (
        <>
          <XCircle className="mr-2 h-4 w-4 text-destructive" />
          Test Again
        </>
      ) : (
        <>
          <Zap className="mr-2 h-4 w-4" />
          Test Connection
        </>
      )}
    </Button>
  )
}
