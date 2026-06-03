import { createFileRoute } from '@tanstack/react-router'
import { DisksBento } from '@/components/disks/disks-bento'
import { createPage } from '@/lib/create-page'
import { diskSpaceConfig } from '@/lib/query-config/system/disks'

const DisksPage = createPage({
  queryConfig: diskSpaceConfig,
  title: 'Disks',
  // Replace the default wide data table with a responsive bento grid of disk
  // cards. Related charts, title and permission gating come from createPage.
  tableSlot: <DisksBento />,
})


export const Route = createFileRoute('/(dashboard)/disks')({
  component: DisksPage,
})
