/**
 * Memory usage monitoring and health metrics
 */

import { getConnectionPoolStats } from '@/lib/clickhouse'
import { getCacheMetrics } from '@/lib/table-existence-cache'

export interface MemoryMetrics {
  heapUsed: number
  heapTotal: number
  heapUsedPercent: number
  external: number
  rss: number
  timestamp: number
}

export interface HealthMetrics {
  memory: MemoryMetrics
  connectionPool: {
    poolSize: number
    totalConnections: number
  }
  tableCache: {
    size: number
    maxSize: number
    memoryLimit: string
  }
  uptime: number
}

/**
 * Get current memory usage statistics
 */
export function getMemoryUsage(): MemoryMetrics {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsedPercent: Math.round((usage.heapUsed / usage.heapTotal) * 100),
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      timestamp: Date.now(),
    }
  }

  return {
    heapUsed: 0,
    heapTotal: 0,
    heapUsedPercent: 0,
    external: 0,
    rss: 0,
    timestamp: Date.now(),
  }
}

/**
 * Get comprehensive health metrics including memory, connection pool, and cache stats
 */
export function getHealthMetrics(): HealthMetrics {
  const connectionPoolStats = getConnectionPoolStats()
  const cacheMetrics = getCacheMetrics()

  return {
    memory: getMemoryUsage(),
    connectionPool: connectionPoolStats,
    tableCache: {
      size: cacheMetrics.size,
      maxSize: cacheMetrics.maxSize || 500,
      memoryLimit: cacheMetrics.memoryLimit || '1MB',
    },
    uptime:
      typeof process !== 'undefined' && process.uptime
        ? Math.round(process.uptime())
        : 0,
  }
}

/**
 * Check if memory usage is above warning threshold (80%)
 */
export function isMemoryWarning(): boolean {
  const metrics = getMemoryUsage()
  return metrics.heapUsedPercent > 80
}

/**
 * Check if memory usage is critical (90%)
 */
export function isMemoryCritical(): boolean {
  const metrics = getMemoryUsage()
  return metrics.heapUsedPercent > 90
}
