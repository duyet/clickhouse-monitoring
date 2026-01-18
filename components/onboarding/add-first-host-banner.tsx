'use client'

import { Database, Plus, Server } from 'lucide-react'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { type AuthSession, useSession } from '@/lib/auth/client'

interface AddFirstHostBannerProps {
  /**
   * Variant for different contexts
   * - 'overlay': Full-page overlay with backdrop
   * - 'banner': Inline banner within dashboard
   */
  variant?: 'overlay' | 'banner'
}

/**
 * Add First Host Banner / Onboarding Overlay
 *
 * Shown to authenticated users who haven't added any hosts yet.
 * Guides them to add their first ClickHouse host to get started.
 */
export function AddFirstHostBanner({
  variant = 'banner',
}: AddFirstHostBannerProps) {
  const router = useRouter()
  const { data: session } = useSession() as { data: AuthSession | null }

  const handleAddHost = useCallback(() => {
    router.push('/hosts/new')
  }, [router])

  // Only show for authenticated users
  if (!session?.user) {
    return null
  }

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-lg rounded-xl border bg-card p-8 shadow-2xl">
          {/* Illustration */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-orange-500/10">
            <div className="relative">
              <Database className="h-10 w-10 text-primary" />
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Welcome to ClickHouse Monitor
            </h2>
            <p className="mt-2 text-muted-foreground">
              Get started by connecting your first ClickHouse instance. You'll
              be able to monitor queries, performance, and system health in
              real-time.
            </p>
          </div>

          {/* Features list */}
          <div className="mt-6 space-y-3">
            <FeatureItem
              icon={<Server className="h-4 w-4" />}
              text="Connect to any ClickHouse instance"
            />
            <FeatureItem
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
              text="Monitor real-time query performance"
            />
            <FeatureItem
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              }
              text="Secure encrypted credential storage"
            />
          </div>

          {/* CTA */}
          <div className="mt-8">
            <Button onClick={handleAddHost} className="w-full" size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Host
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Banner variant
  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-orange-500/5 p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Database className="h-6 w-6 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-semibold">Add your first ClickHouse host</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect a ClickHouse instance to start monitoring queries,
            performance, and system metrics.
          </p>
        </div>

        {/* CTA */}
        <Button onClick={handleAddHost} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Host
        </Button>
      </div>
    </div>
  )
}

/**
 * Feature item for the overlay variant
 */
function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-primary">
        {icon}
      </div>
      <span className="text-sm">{text}</span>
    </div>
  )
}
