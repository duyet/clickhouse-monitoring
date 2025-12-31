/**
 * Chart Registry Types
 *
 * Core type definitions for the chart registry system.
 */

import type { LazyExoticComponent } from 'react'
import type { ChartProps } from '@/components/charts/chart-props'

// Re-export ChartProps for convenience
export type { ChartProps }

// Chart component type
export type ChartComponent = React.ComponentType<ChartProps>

// Chart skeleton types for realistic loading states
export type ChartSkeletonType = 'area' | 'bar' | 'line' | 'metric' | 'table'

// Lazy-loaded chart component type
export type LazyChartComponent = LazyExoticComponent<ChartComponent>

// Registry mapping type
export type ChartRegistryMap = Record<string, LazyChartComponent>
