/**
 * Tool assembler — imports all category modules and composes the full tool set.
 *
 * This replaces the monolithic mcp-tool-adapter.ts with a modular system.
 * Each category file exports a factory function that returns tools for that domain.
 */

import 'server-only'

import { createAskUserTools } from './ask-user-tools'
import { createClusterTools } from './cluster-tools'
import { createControlTools } from './control-tools'
import { createDashboardTools } from './dashboard-tools'
import { createHealthTools } from './health-tools'
import { createLogTools } from './log-tools'
import { createMergeTools } from './merge-tools'
import { createQueryTools } from './query-tools'
import { createReplicationTools } from './replication-tools'
import { createSchemaTools } from './schema-tools'
import { createSecurityTools } from './security-tools'
import { createSettingsTools } from './settings-tools'
import { createSkillTools } from './skill-tools'
import { createStorageTools } from './storage-tools'
import { createAnomalyTools } from './anomaly-tools'
import { createZookeeperTools } from './zookeeper-tools'

/**
 * Create all agent tools for a given host.
 * Returns a flat object of all tools across all categories.
 */
export function createAllTools(hostId: number) {
  return {
    // Schema & exploration
    ...createSchemaTools(hostId),

    // Query analysis
    ...createQueryTools(hostId),

    // System health
    ...createHealthTools(hostId),

    // Merges & mutations
    ...createMergeTools(hostId),

    // Storage & parts
    ...createStorageTools(hostId),

    // Replication
    ...createReplicationTools(hostId),

    // Security & audit
    ...createSecurityTools(hostId),

    // Cluster
    ...createClusterTools(hostId),

    // Control actions (destructive)
    ...createControlTools(hostId),

    // Dashboard navigation
    ...createDashboardTools(),

    // Settings & config
    ...createSettingsTools(hostId),

    // Logs
    ...createLogTools(hostId),

    // ZooKeeper
    ...createZookeeperTools(hostId),

    // Skills
    ...createSkillTools(),

    // User interaction
    ...createAskUserTools(),

    // Anomaly detection
    ...createAnomalyTools(hostId),
  }
}
