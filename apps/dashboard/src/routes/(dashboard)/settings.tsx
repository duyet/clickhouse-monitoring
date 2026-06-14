import { createFileRoute } from '@tanstack/react-router'

import { createPage } from '@/lib/create-page'
import { settingsConfig } from '@/lib/query-config/more/settings'

const SettingsPage = createPage({
  queryConfig: settingsConfig,
  title: 'Settings',
})

export const Route = createFileRoute('/(dashboard)/settings')({
  component: SettingsPage,
})
