'use client'

import {
  Download,
  Layout,
  Monitor,
  Moon,
  RefreshCw,
  RotateCcw,
  Sun,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import type { RefreshIntervalValue } from '@/lib/constants/settings'
import type { UserSettings } from '@/lib/types/user-settings'

import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  REFRESH_INTERVAL_OPTIONS,
  TABLE_DENSITY_OPTIONS,
} from '@/lib/constants/settings'
import { TIMEZONE_GROUPS } from '@/lib/constants/timezones'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { cn } from '@/lib/utils'
import { exportSettings, importSettings } from '@/lib/utils/settings-utils'

interface SettingsFormProps {
  settings: UserSettings
  onUpdate: (updates: Partial<UserSettings>) => void
  onClose: () => void
}

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Light mode' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark mode' },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Sync with system',
  },
] as const

export function SettingsForm({
  settings,
  onUpdate,
  onClose,
}: SettingsFormProps) {
  const { setTheme } = useTheme()
  const { resetSettings } = useUserSettings()
  const [defaultTimezone, setDefaultTimezone] = useState<string | null>(null)
  const [isLoadingDefault, setIsLoadingDefault] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch default timezone from API
  useEffect(() => {
    async function fetchDefaultTimezone() {
      try {
        const response = await fetch('/api/v1/dashboard/settings?hostId=0')
        if (response.ok) {
          const data = (await response.json()) as {
            success?: boolean
            data?: { params?: { timezone?: string } }
          }
          if (data.success && data.data?.params?.timezone) {
            setDefaultTimezone(data.data.params.timezone)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch default timezone:', error)
      } finally {
        setIsLoadingDefault(false)
      }
    }

    fetchDefaultTimezone()
  }, [])

  const handleThemeChange = (value: UserSettings['theme']) => {
    onUpdate({ theme: value })
    setTheme(value)
  }

  const handleResetTimezone = () => {
    if (defaultTimezone) {
      onUpdate({ timezone: defaultTimezone })
    }
  }

  const isUsingDefault =
    defaultTimezone && settings.timezone === defaultTimezone

  const handleExportSettings = () => {
    try {
      exportSettings(settings)
      toast.success('Settings exported successfully')
    } catch (_error) {
      toast.error('Failed to export settings')
    }
  }

  const handleImportSettings = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const result = await importSettings(file)
      if (result.error) {
        toast.error(result.error)
      } else {
        onUpdate(result.settings)
        toast.success('Settings imported successfully')
      }
    } catch (_error) {
      toast.error('Failed to import settings')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleResetAll = () => {
    resetSettings({ timezone: defaultTimezone ?? undefined })
    toast.success('Settings reset to defaults')
  }

  return (
    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
      {/* Timezone Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="timezone" className="text-sm font-medium">
            Timezone
          </Label>
          {!isLoadingDefault && defaultTimezone && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleResetTimezone}
              disabled={!!isUsingDefault}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset to default
            </Button>
          )}
        </div>
        <Select
          value={settings.timezone}
          onValueChange={(value) => onUpdate({ timezone: value })}
        >
          <SelectTrigger id="timezone" className="h-9">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel className="text-xs">{group.label}</SelectLabel>
                {group.timezones.map((tz) => (
                  <SelectItem
                    key={tz.value}
                    value={tz.value}
                    className="text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{tz.label}</span>
                      {defaultTimezone === tz.value && (
                        <span className="text-[10px] text-muted-foreground">
                          (default)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          All datetimes will be displayed in your selected timezone
        </p>
      </section>

      <Separator />

      {/* Theme Section */}
      <section className="space-y-3">
        <Label className="text-sm font-medium">Theme</Label>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon
            const isSelected = settings.theme === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleThemeChange(option.value)}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all hover:opacity-80',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-muted bg-muted/20'
                )}
                aria-pressed={isSelected}
                aria-label={`Select ${option.description}`}
              >
                <Icon className="mb-2 h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <Separator />

      {/* Data Refresh Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Data Refresh</Label>
        </div>

        {/* Auto-refresh toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically refresh data at regular intervals
            </p>
          </div>
          <Switch
            id="auto-refresh"
            checked={settings.autoRefresh}
            onCheckedChange={(checked) => onUpdate({ autoRefresh: checked })}
          />
        </div>

        {/* Refresh interval selector */}
        {settings.autoRefresh && (
          <div className="space-y-2">
            <Label htmlFor="refresh-interval" className="text-sm">
              Refresh interval
            </Label>
            <Select
              value={String(settings.refreshInterval)}
              onValueChange={(value) =>
                onUpdate({
                  refreshInterval: Number(value) as RefreshIntervalValue,
                })
              }
            >
              <SelectTrigger id="refresh-interval" className="h-9">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_INTERVAL_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={String(option.value)}
                    className="text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </section>

      <Separator />

      {/* Display Settings Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Display</Label>
        </div>

        {/* Table density */}
        <div className="space-y-2">
          <Label htmlFor="table-density" className="text-sm">
            Table density
          </Label>
          <Select
            value={settings.tableDensity}
            onValueChange={(value) =>
              onUpdate({ tableDensity: value as UserSettings['tableDensity'] })
            }
          >
            <SelectTrigger id="table-density" className="h-9">
              <SelectValue placeholder="Select density" />
            </SelectTrigger>
            <SelectContent>
              {TABLE_DENSITY_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Compact mode toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="compact-mode" className="text-sm">
              Compact mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Reduce spacing throughout the interface
            </p>
          </div>
          <Switch
            id="compact-mode"
            checked={settings.compactMode}
            onCheckedChange={(checked) => onUpdate({ compactMode: checked })}
          />
        </div>
      </section>

      <Separator />

      {/* Data Management Section */}
      <section className="space-y-3">
        <Label className="text-sm font-medium">Data Management</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleExportSettings}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportSettings}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full h-8 text-muted-foreground hover:text-destructive"
          onClick={handleResetAll}
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Reset all to defaults
        </Button>
      </section>

      <div className="flex justify-end pt-4">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  )
}
