/**
 * Types for ClickHouse schema documentation generator
 */

/**
 * A single column in a system table
 */
export interface SchemaColumn {
  name: string
  type: string
  description?: string
  /** Version when this column was added (e.g., "24.1") */
  addedIn?: string
  /** Version when this column was removed */
  removedIn?: string
  /** Version when this column was deprecated */
  deprecatedIn?: string
}

/**
 * Full schema for a system table
 */
export interface TableSchema {
  name: string
  description?: string
  columns: SchemaColumn[]
  /** Minimum ClickHouse version for this table */
  minVersion?: string
  /** Whether this table requires configuration */
  requiresConfig?: boolean
  /** Config key if requiresConfig is true */
  configKey?: string
}

/**
 * A change to a system table in a specific version
 */
export interface VersionChange {
  version: string
  table: string
  changeType: 'column_added' | 'column_removed' | 'column_renamed' | 'type_changed' | 'behavior_changed'
  column?: string
  oldName?: string
  newName?: string
  oldType?: string
  newType?: string
  description?: string
}

/**
 * Parsed changelog entry
 */
export interface ChangelogEntry {
  version: string
  releaseDate?: string
  isLTS: boolean
  changes: VersionChange[]
}

/**
 * CLI options
 */
export interface CLIOptions {
  /** Specific version to process */
  version?: string
  /** Specific table to process */
  table?: string
  /** Output directory */
  output: string
  /** Verbose logging */
  verbose: boolean
}
