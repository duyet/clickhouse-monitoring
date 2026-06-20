import { ArrowLeft, Sparkles } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

import { InsightsPreview } from '@/components/insights/insights-preview'
import { InsightsSettingsForm } from '@/components/insights/insights-settings-form'
import { AppLink } from '@/components/ui/app-link'
import { Button } from '@/components/ui/button'
import { useHostId } from '@/lib/swr'
import { buildUrl } from '@/lib/url/url-builder'

function InsightsSettingsPage() {
  const hostId = useHostId()

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground -ml-2 h-7 gap-1.5"
          asChild
        >
          <AppLink href={buildUrl('/overview', { host: hostId })}>
            <ArrowLeft className="size-3.5" />
            Back to overview
          </AppLink>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-sky-500/10">
            <Sparkles className="size-5 text-sky-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI Insights Settings
            </h1>
            <p className="text-muted-foreground text-sm">
              Configure how the dashboard analyzes this cluster.
            </p>
          </div>
        </div>
      </div>

      <InsightsSettingsForm />
      <InsightsPreview hostId={hostId} />
    </div>
  )
}

export const Route = createFileRoute('/(dashboard)/insights-settings')({
  component: InsightsSettingsPage,
})
