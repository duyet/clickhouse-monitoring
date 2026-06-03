import { createFileRoute } from '@tanstack/react-router'
import { createPage } from '@/lib/create-page'
import { mergeTreeSettingsConfig } from '@/lib/query-config/more/mergetree-settings'

const MergetreeSettingsPage = createPage({
  queryConfig: mergeTreeSettingsConfig,
  title: 'MergeTree Settings',
})


export const Route = createFileRoute('/(dashboard)/mergetree-settings')({
  component: MergetreeSettingsPage,
})
