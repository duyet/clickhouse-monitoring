/**
 * Settings Utilities
 *
 * Utility functions for exporting, importing, and resetting user settings.
 */

import { SETTINGS_FILENAME, SETTINGS_VERSION } from '@/lib/constants/settings'
import {
  DEFAULT_USER_SETTINGS,
  USER_SETTINGS_STORAGE_KEY,
  type UserSettings,
} from '@/lib/types/user-settings'

/**
 * Export settings to JSON file
 */
export function exportSettings(settings: UserSettings): void {
  const exportData = {
    version: SETTINGS_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = SETTINGS_FILENAME
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import settings from JSON file
 */
export async function importSettings(
  file: File
): Promise<{ settings: Partial<UserSettings>; error?: string }> {
  try {
    const text = await file.text()
    const data = JSON.parse(text) as {
      version?: number
      settings?: Partial<UserSettings>
    }

    if (!data.settings) {
      return { settings: {}, error: 'Invalid settings file format' }
    }

    // Validate and migrate settings if needed
    const validatedSettings = validateAndMigrateSettings(
      data.settings,
      data.version
    )

    return { settings: validatedSettings }
  } catch (error) {
    return {
      settings: {},
      error: error instanceof Error ? error.message : 'Failed to parse file',
    }
  }
}

/**
 * Validate and migrate settings from older versions
 */
function validateAndMigrateSettings(
  settings: Partial<UserSettings>,
  _version?: number
): Partial<UserSettings> {
  const migrated: Partial<UserSettings> = {}

  // Copy valid settings
  for (const [key, value] of Object.entries(settings)) {
    if (key in DEFAULT_USER_SETTINGS) {
      // Type guard to ensure value matches expected type
      const defaultValue = DEFAULT_USER_SETTINGS[
        key as keyof UserSettings
      ] as unknown
      if (typeof value === typeof defaultValue) {
        migrated[key as keyof UserSettings] = value as never
      }
    }
  }

  return migrated
}

/**
 * Reset settings to defaults
 * Preserves backend-specific settings like timezone if available
 */
export function resetToDefaults(
  _currentSettings: UserSettings,
  backendDefaults?: Partial<UserSettings>
): UserSettings {
  return {
    ...DEFAULT_USER_SETTINGS,
    // Preserve backend timezone if it was set
    ...(backendDefaults?.timezone && {
      timezone: backendDefaults.timezone,
    }),
  }
}

/**
 * Clear all settings from localStorage
 */
export function clearSettings(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_SETTINGS_STORAGE_KEY)
  }
}

/**
 * Get settings file info from imported file
 */
export async function getSettingsFileInfo(
  file: File
): Promise<{ filename: string; size: number } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const text = reader.result as string
        const _data = JSON.parse(text) as {
          version?: number
          exportedAt?: string
        }

        resolve({
          filename: file.name,
          size: file.size,
        })
      } catch {
        resolve(null)
      }
    }

    reader.onerror = () => resolve(null)

    reader.readAsText(file)
  })
}
