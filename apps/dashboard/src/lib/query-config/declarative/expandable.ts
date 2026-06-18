/**
 * Compile a declarative `expandable` spec into a runtime ExpandableConfig.
 *
 * The serializable spec (DeclarativeExpandableSpec) carries only data; this
 * module dispatches on its `type` and binds the matching row-detail factory.
 * It mirrors row-style.ts (compileRowStyle): the loader stays declarative-in,
 * runtime-out and never embeds JSX itself.
 *
 * Lives next to the loader (not in schema.ts) because it imports a `.tsx`
 * factory — keeping that React dependency out of the pure schema module.
 */

import type { ExpandableConfig } from '@/types/query-config'
import type { DeclarativeExpandableSpec } from './schema'

import { createConfigExpandedDetails } from '@/components/data-table/cells/config-expanded-details'

/**
 * Compile a declarative expandable spec into the in-memory ExpandableConfig
 * the data table consumes (`{ renderExpanded }`).
 *
 * Currently supports the `config-details` variant (an auto-grid of the row's
 * non-primary columns). The discriminated union leaves room for the `panel`
 * variant; an unknown `type` throws so a malformed spec fails loud at load.
 */
export function compileExpandable(
  spec: DeclarativeExpandableSpec
): ExpandableConfig {
  switch (spec.type) {
    case 'config-details':
      return {
        renderExpanded: createConfigExpandedDetails({
          primaryColumns: spec.primaryColumns,
          descriptionKey: spec.descriptionKey,
        }),
      }
    default: {
      // Exhaustiveness guard — a new union member must add a case above.
      const exhaustive: never = spec.type
      throw new Error(`Unknown expandable spec type: ${String(exhaustive)}`)
    }
  }
}
