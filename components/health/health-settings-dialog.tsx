'use client'

import { Settings } from 'lucide-react'
import { toast } from 'sonner'

import { HEALTH_CHECKS } from './health-checks'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  fireBrowserNotification,
  fireWebhook,
} from '@/lib/health/alert-dispatcher'
import {
  type AlertSettings,
  DEFAULT_ALERT_SETTINGS,
  loadAlertSettings,
  saveAlertSettings,
} from '@/lib/health/alert-settings-storage'
import {
  loadThresholds,
  saveThresholds,
  type ThresholdsMap,
} from '@/lib/health/thresholds-storage'

export function HealthSettingsDialog() {
  const [open, setOpen] = useState(false)
  const [thresholds, setThresholdsState] = useState<ThresholdsMap>({})
  const [alerts, setAlerts] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS)

  useEffect(() => {
    if (!open) return
    setThresholdsState(loadThresholds())
    setAlerts(loadAlertSettings())
  }, [open])

  const handleThresholdChange = (
    id: string,
    kind: 'warning' | 'critical',
    raw: string
  ) => {
    const n = Number(raw)
    if (!Number.isFinite(n)) return
    setThresholdsState((prev) => {
      const def = HEALTH_CHECKS.find((c) => c.id === id)?.defaults
      const current = prev[id] ?? def ?? { warning: 0, critical: 0 }
      return { ...prev, [id]: { ...current, [kind]: n } }
    })
  }

  const handleReset = (id: string) => {
    setThresholdsState((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleSave = () => {
    saveThresholds(thresholds)
    saveAlertSettings(alerts)
    toast.success('Health settings saved')
    setOpen(false)
  }

  const handleEnableBrowser = async (checked: boolean) => {
    if (checked && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission()
        if (result !== 'granted') {
          toast.error('Browser notifications were not granted')
          return
        }
      } else if (Notification.permission === 'denied') {
        toast.error(
          'Browser notifications are blocked. Enable them in your browser settings.'
        )
        return
      }
    }
    setAlerts((prev) => ({ ...prev, browserNotificationsEnabled: checked }))
  }

  const handleTestWebhook = async () => {
    if (!alerts.webhookUrl) {
      toast.error('Enter a webhook URL first')
      return
    }
    // Persist current input so fireWebhook picks it up
    saveAlertSettings({ ...alerts, webhookEnabled: true })
    const ok = await fireWebhook({
      checkId: 'test',
      title: 'Test Alert',
      severity: 'warning',
      value: 0,
      label: 'This is a test alert from ClickHouse Monitor',
      hostId: 0,
    })
    if (ok) toast.success('Test alert sent')
    else toast.error('Webhook request failed')
  }

  const handleTestBrowser = () => {
    if (Notification.permission !== 'granted') {
      toast.error('Browser notifications are not granted')
      return
    }
    fireBrowserNotification({
      checkId: 'test',
      title: 'Test Alert',
      severity: 'warning',
      value: 0,
      label: 'This is a test alert from ClickHouse Monitor',
      hostId: 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Health Settings</DialogTitle>
          <DialogDescription>
            Configure per-check thresholds and alert delivery. Settings are
            stored locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="thresholds">
          <TabsList>
            <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="thresholds">
            <ScrollArea className="h-[420px] pr-3">
              <div className="flex flex-col gap-3">
                {HEALTH_CHECKS.map((check) => {
                  const current = thresholds[check.id] ?? check.defaults
                  const isOverridden = thresholds[check.id] !== undefined
                  return (
                    <div
                      key={check.id}
                      className="flex flex-col gap-2 rounded-md border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {check.title}
                        </span>
                        {isOverridden && (
                          <button
                            type="button"
                            onClick={() => handleReset(check.id)}
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            Reset to default
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <Label
                            htmlFor={`${check.id}-warning`}
                            className="text-xs text-muted-foreground"
                          >
                            Warning ≥
                          </Label>
                          <Input
                            id={`${check.id}-warning`}
                            type="number"
                            inputMode="decimal"
                            value={current.warning}
                            onChange={(e) =>
                              handleThresholdChange(
                                check.id,
                                'warning',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label
                            htmlFor={`${check.id}-critical`}
                            className="text-xs text-muted-foreground"
                          >
                            Critical ≥
                          </Label>
                          <Input
                            id={`${check.id}-critical`}
                            type="number"
                            inputMode="decimal"
                            value={current.critical}
                            onChange={(e) =>
                              handleThresholdChange(
                                check.id,
                                'critical',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex flex-col">
                <Label className="text-sm font-medium">
                  Browser notifications
                </Label>
                <span className="text-xs text-muted-foreground">
                  Show desktop notifications for new health alerts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTestBrowser}
                  disabled={!alerts.browserNotificationsEnabled}
                >
                  Test
                </Button>
                <Switch
                  checked={alerts.browserNotificationsEnabled}
                  onCheckedChange={handleEnableBrowser}
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label className="text-sm font-medium">Webhook alerts</Label>
                  <span className="text-xs text-muted-foreground">
                    POST a JSON payload to a Slack- or Discord-compatible URL
                  </span>
                </div>
                <Switch
                  checked={alerts.webhookEnabled}
                  onCheckedChange={(checked) =>
                    setAlerts((prev) => ({ ...prev, webhookEnabled: checked }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  value={alerts.webhookUrl}
                  onChange={(e) =>
                    setAlerts((prev) => ({
                      ...prev,
                      webhookUrl: e.target.value,
                    }))
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTestWebhook}
                  disabled={!alerts.webhookUrl}
                >
                  Send test
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex flex-col">
                <Label className="text-sm font-medium">Minimum severity</Label>
                <span className="text-xs text-muted-foreground">
                  Send alerts only at or above this severity
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  className={
                    alerts.minSeverity === 'warning'
                      ? 'rounded-md bg-secondary px-2 py-1'
                      : 'rounded-md px-2 py-1 text-muted-foreground'
                  }
                  onClick={() =>
                    setAlerts((prev) => ({ ...prev, minSeverity: 'warning' }))
                  }
                >
                  Warning+
                </button>
                <button
                  type="button"
                  className={
                    alerts.minSeverity === 'critical'
                      ? 'rounded-md bg-secondary px-2 py-1'
                      : 'rounded-md px-2 py-1 text-muted-foreground'
                  }
                  onClick={() =>
                    setAlerts((prev) => ({ ...prev, minSeverity: 'critical' }))
                  }
                >
                  Critical only
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
