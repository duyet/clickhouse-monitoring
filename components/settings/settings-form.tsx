'use client'

import { Monitor, Moon, RotateCcw, Sun } from 'lucide-react'

import type { UserSettings } from '@/lib/types/user-settings'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
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
import { TIMEZONE_GROUPS } from '@/lib/constants/timezones'
import { cn } from '@/lib/utils'

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
  const [defaultTimezone, setDefaultTimezone] = useState<string | null>(null)
  const [isLoadingDefault, setIsLoadingDefault] = useState(true)

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

  return (
    <div className="space-y-6 py-4">
      {/* Timezone Section */}
      <div className="space-y-3">
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
      </div>

      {/* Theme Section */}
      <div className="space-y-3">
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
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  )
}
