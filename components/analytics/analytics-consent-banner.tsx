/**
 * Analytics Consent Banner
 * Simple banner for analytics consent (internal tool context)
 */

'use client'

import { useAnalyticsContext } from './analytics-provider'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const CONSENT_DISMISSED_KEY = 'analytics-consent-dismissed'

export function AnalyticsConsentBanner() {
  const { hasConsent, setConsent } = useAnalyticsContext()
  const [_dismissed, setDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed the banner
    const dismissed = localStorage.getItem(CONSENT_DISMISSED_KEY) === 'true'
    setDismissed(dismissed)

    // Show banner if not dismissed and no consent set
    if (!dismissed && !hasConsent) {
      setIsVisible(true)
    }
  }, [hasConsent])

  const handleAccept = () => {
    setConsent(true)
    setIsVisible(false)
    localStorage.setItem(CONSENT_DISMISSED_KEY, 'true')
  }

  const handleDecline = () => {
    setConsent(false)
    setIsVisible(false)
    localStorage.setItem(CONSENT_DISMISSED_KEY, 'true')
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(CONSENT_DISMISSED_KEY, 'true')
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Analytics & Monitoring</CardTitle>
          <CardDescription className="text-sm">
            Help us improve the dashboard by tracking usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">
            We collect anonymous usage data to understand which features are
            most valuable and identify performance issues. This data is stored
            in your ClickHouse instance only.
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button size="sm" variant="default" onClick={handleAccept}>
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={handleDecline}>
            Decline
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={handleDismiss}
          >
            Dismiss
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
