/**
 * Miscellaneous chart imports
 *
 * Lazy-loaded charts that don't fit into specific categories.
 */

import type { ChartRegistryMap } from '@/components/charts/registry/types'

import { lazy } from 'react'

export const miscChartImports: ChartRegistryMap = {
  // Mutation Charts
  'summary-used-by-mutations': lazy(() =>
    import('@/components/charts/summary-used-by-mutations').then((m) => ({
      default: m.ChartSummaryUsedByMutations,
    }))
  ),

  // Running Queries Charts
  'summary-used-by-running-queries': lazy(() =>
    import('@/components/charts/summary-used-by-running-queries').then((m) => ({
      default: m.default,
    }))
  ),

  // Connection Charts
  'connections-interserver': lazy(() =>
    import('@/components/charts/connections-interserver').then((m) => ({
      default: m.ChartConnectionsInterserver,
    }))
  ),
  'connections-http': lazy(() =>
    import('@/components/charts/connections-http').then((m) => ({
      default: m.ChartConnectionsHttp,
    }))
  ),

  // Table Charts
  'top-table-size': lazy(() =>
    import('@/components/charts/top-table-size').then((m) => ({
      default: m.default,
    }))
  ),

  // Page Views Charts
  'page-view': lazy(() =>
    import('@/components/charts/page-view').then((m) => ({
      default: m.PageViewBarChart,
    }))
  ),

  // Page Analytics Charts
  'top-pages': lazy(() =>
    import('@/components/charts/top-pages').then((m) => ({
      default: m.TopPagesChart,
    }))
  ),
  'human-vs-bot-pageviews': lazy(() =>
    import('@/components/charts/human-vs-bot-pageviews').then((m) => ({
      default: m.HumanVsBotPageviewsChart,
    }))
  ),
  'pageviews-by-device': lazy(() =>
    import('@/components/charts/pageviews-by-device').then((m) => ({
      default: m.PageviewsByDeviceChart,
    }))
  ),
  'pageviews-by-country': lazy(() =>
    import('@/components/charts/pageviews-by-country').then((m) => ({
      default: m.PageviewsByCountryChart,
    }))
  ),
}
