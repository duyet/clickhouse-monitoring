import {
  ActivityIcon,
  DatabaseIcon,
  HardDriveIcon,
  InfoIcon,
  Loader2Icon,
  RefreshCwIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react'

export const MetricIcons = {
  Activity: <ActivityIcon className="size-4" strokeWidth={2.5} />,
  Database: <DatabaseIcon className="size-4" strokeWidth={2.5} />,
  HardDrive: <HardDriveIcon className="size-4" strokeWidth={2.5} />,
  Info: <InfoIcon className="size-4" strokeWidth={2.5} />,
  Loader: (
    <Loader2Icon className="size-4 animate-spin" strokeWidth={2.5} />
  ),
  Refresh: <RefreshCwIcon className="size-4" strokeWidth={2.5} />,
  TrendingDown: <TrendingDownIcon className="size-4" strokeWidth={2.5} />,
  TrendingUp: <TrendingUpIcon className="size-4" strokeWidth={2.5} />,
} as const
