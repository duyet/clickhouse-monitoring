import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createDashboardTools() {
  return {
    get_dashboard_pages: dynamicTool({
      description:
        'List all available dashboard pages with their paths and descriptions.',
      inputSchema: z.object({}),
      execute: async (_input: unknown) => {
        return [
          {
            path: '/overview',
            title: 'Overview',
            description: 'System metrics, queries, merges, replication',
          },
          {
            path: '/tables',
            title: 'Tables',
            description: 'All tables with sizes and row counts',
          },
          {
            path: '/clusters',
            title: 'Clusters',
            description: 'Cluster topology and health',
          },
          {
            path: '/running-queries',
            title: 'Running Queries',
            description: 'Currently executing queries',
          },
          {
            path: '/history-queries',
            title: 'Query History',
            description: 'Past query performance',
          },
          {
            path: '/merges',
            title: 'Merges',
            description: 'Background merge operations',
          },
          {
            path: '/replicas',
            title: 'Replicas',
            description: 'Replication status',
          },
          {
            path: '/explorer',
            title: 'Explorer',
            description: 'Database and table browser',
          },
          {
            path: '/settings',
            title: 'Settings',
            description: 'Server settings and configuration',
          },
          {
            path: '/backups',
            title: 'Backups',
            description: 'Backup status and history',
          },
          {
            path: '/dashboard',
            title: 'Chart Builder',
            description: 'Custom chart builder',
          },
        ]
      },
    }),

    get_chart_data: dynamicTool({
      description:
        'Fetch chart data for a named chart. Provides guidance on how to retrieve data using the query tool.',
      inputSchema: z.object({
        chartName: z.string().describe('Name of the chart to fetch data for'),
        hostId: z.number().optional().describe('Host index override'),
      }),
      execute: async (_input: unknown) => {
        return {
          message:
            'Use the query tool with appropriate SQL to fetch chart data. Check the dashboard pages for available views.',
        }
      },
    }),
  }
}
