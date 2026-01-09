/**
 * DataTable Sub-Components
 *
 * Organized components extracted from data-table.tsx for better maintainability.
 * Each component handles a specific section of the data table.
 */

export type { DataTableContentProps } from './data-table-content'
export type { DataTableFooterProps } from './data-table-footer'
export type { DataTableHeaderProps } from './data-table-header'
export type { ColumnManagerProps } from './column-manager'
export type { SelectionManagerProps } from './selection-manager'
export type { DataTableCoreProps } from './data-table-core'

export { BulkActions } from './bulk-actions'
export { DataTableContent } from './data-table-content'
export { DataTableFooter } from './data-table-footer'
export { DataTableHeader } from './data-table-header'
export { ColumnManager } from './column-manager'
export { SelectionManager, createCustomSelectionColumn } from './selection-manager'
export { DataTableCore, createTable } from './data-table-core'
