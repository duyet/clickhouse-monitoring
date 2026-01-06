import type { MetricTheme, ThemeConfig } from './types'

export const THEME_CONFIGS: Record<MetricTheme, ThemeConfig> = {
  default: {
    gradient: 'from-slate-500/10 to-slate-600/5',
    iconColor: 'text-slate-500 dark:text-slate-400',
    textColor: 'text-slate-700 dark:text-slate-200',
    bgColor: 'bg-slate-50/80 dark:bg-slate-900/50',
  },
  purple: {
    gradient: 'from-purple-500/20 via-violet-500/15 to-indigo-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
    textColor: 'text-purple-700 dark:text-purple-200',
    bgColor: 'bg-purple-50/90 dark:bg-purple-950/40',
  },
  blue: {
    gradient: 'from-blue-500/20 via-sky-500/15 to-cyan-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-700 dark:text-blue-200',
    bgColor: 'bg-blue-50/90 dark:bg-blue-950/40',
  },
  green: {
    gradient: 'from-emerald-500/20 via-green-500/15 to-teal-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    textColor: 'text-emerald-700 dark:text-emerald-200',
    bgColor: 'bg-emerald-50/90 dark:bg-emerald-950/40',
  },
  orange: {
    gradient: 'from-orange-500/20 via-amber-500/15 to-yellow-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
    textColor: 'text-orange-700 dark:text-orange-200',
    bgColor: 'bg-orange-50/90 dark:bg-orange-950/40',
  },
  pink: {
    gradient: 'from-pink-500/20 via-rose-500/15 to-red-500/10',
    iconColor: 'text-pink-600 dark:text-pink-400',
    textColor: 'text-pink-700 dark:text-pink-200',
    bgColor: 'bg-pink-50/90 dark:bg-pink-950/40',
  },
  cyan: {
    gradient: 'from-cyan-500/20 via-teal-500/15 to-emerald-500/10',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    textColor: 'text-cyan-700 dark:text-cyan-200',
    bgColor: 'bg-cyan-50/90 dark:bg-cyan-950/40',
  },
  indigo: {
    gradient: 'from-indigo-500/20 via-violet-500/15 to-purple-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    textColor: 'text-indigo-700 dark:text-indigo-200',
    bgColor: 'bg-indigo-50/90 dark:bg-indigo-950/40',
  },
}
