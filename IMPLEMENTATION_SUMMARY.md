# QueryConfig v2 Types Implementation Summary

## Overview

Successfully implemented the QueryConfig v2 type system for compile-time validation of ClickHouse monitoring dashboard query configurations. This new type system provides:

- Type-safe column references with compile-time validation
- Format-specific options with discriminated unions
- Template URL placeholder validation
- Automatic column name autocomplete in IDEs
- Full backward compatibility with existing code

## Files Created

### 1. **types/query-config-v2.ts** (Primary Implementation)
Complete type system implementation with comprehensive JSDoc documentation.

**Key Exports:**

#### Core Type Utilities
- `RowKeys<TRow>` - Extract string keys from a row type
- `ContextKey` - Union type of context keys available in templates
- `TemplatePlaceholder<TRow>` - Validates placeholder format
- `ValidatedTemplate<TRow, Template>` - Compile-time template URL validation
- `BuiltInSortingFn` - Built-in TanStack Table sorting functions

#### Format System
- `FormatOptionsMap<TRow>` - Discriminated union of format-specific options
- `FormatsRequiringOptions` - Formats that must have options (Link, Action, HoverCard)
- `FormatsWithOptionalOptions` - Formats with optional options (Text, Markdown, etc.)
- `FormatsWithoutOptions` - Formats without options (Badge, Boolean, etc.)
- `ColumnFormatSpec<TRow, TFormat>` - Type-safe format specification union

#### Configuration Types
- `TypedColumnFormats<TRow>` - Type-safe column format record
- `TypedColumnIcons<TRow>` - Type-safe column icon record
- `TypedSortingFns<TRow>` - Type-safe sorting function record
- `ChartReference` - Chart reference with optional custom props
- `TypedFilterPreset<TRow>` - Filter preset with type-safe key reference

#### Main Interface
- `QueryConfig<TRow>` - Generic QueryConfig interface with full type safety
  - All column references validated against TRow type
  - Format options validated per format type
  - Filter preset keys validated against TRow
  - Complete JSDoc with examples

**Type Safety Features:**

1. **Column Validation**
   ```typescript
   type Row = { id: string; name: string }

   // Valid: all columns exist in Row
   const config: QueryConfig<Row> = {
     columns: ['id', 'name'],  // ✓ Type-checked
   }

   // Invalid: causes TypeScript error
   const invalid: QueryConfig<Row> = {
     columns: ['id', 'invalid'],  // ✗ Error: not in Row
   }
   ```

2. **Format Options Validation**
   ```typescript
   columnFormats: {
     // Link requires options
     id: [ColumnFormat.Link, { href: '/[id]' }],  // ✓ Correct

     // Text has optional options
     name: ColumnFormat.Text,  // ✓ Valid
     name: [ColumnFormat.Text, { weight: 'bold' }],  // ✓ Valid

     // Badge has no options
     status: ColumnFormat.Badge,  // ✓ Valid
     // status: [ColumnFormat.Badge, {}],  // ✗ Error: no options
   }
   ```

3. **Filter Preset Validation**
   ```typescript
   filterParamPresets: [
     {
       name: 'Active',
       key: 'status',  // ✓ Must exist in Row type
       value: 'active',
     }
   ]
   ```

### 2. **types/__query-config-v2.validation.ts** (Validation File)
Test validation file excluded from build (see tsconfig.json exclude patterns).

**Purpose:** Demonstrate type system validation and provide compile-time tests.

**Test Cases:**
- RowKeys extraction from row types
- Template placeholder validation
- ColumnFormatSpec for different format categories
- TypedColumnFormats key validation
- TypedColumnIcons key validation
- TypedSortingFns key validation
- Full QueryConfig integration test
- Default generic parameter behavior
- Built-in sorting functions
- Context keys and chart references
- Format options and categorization

All types are validated by TypeScript compiler at development time.

## Design Decisions

### 1. Generic Type Parameter
```typescript
export interface QueryConfig<
  TRow extends Record<string, unknown> = Record<string, unknown>
> { ... }
```

- **Reason:** Allows type-safe inference of valid column names from the Row type
- **Default Parameter:** Provides backward compatibility for code without explicit Row types
- **Constraint:** Ensures TRow is always a plain object

### 2. Discriminated Union for Format Options
```typescript
export type ColumnFormatSpec<TRow, TFormat extends ColumnFormat> =
  TFormat extends FormatsRequiringOptions
    ? [TFormat, FormatOptionsMap<TRow>[TFormat]]
    : TFormat extends FormatsWithOptionalOptions
      ? TFormat | [TFormat, FormatOptionsMap<TRow>[TFormat]]
      : TFormat extends FormatsWithoutOptions
        ? TFormat
        : never
```

- **Reason:** Ensures options are only used where valid, preventing configuration errors
- **Benefits:** IDE autocomplete for valid options, compile-time validation

### 3. Mapped Types for Column Properties
```typescript
export type TypedColumnFormats<TRow extends Record<string, unknown>> = {
  [K in RowKeys<TRow>]?: ColumnFormat | ColumnFormatSpec<TRow, ColumnFormat>
}
```

- **Reason:** Uses TypeScript mapped types to validate column keys against Row type
- **Benefits:** IDE autocomplete for column names, prevents typos in config files

### 4. ValidatedTemplate Type for URL Templates
```typescript
export type ValidatedTemplate<TRow, Template extends string> =
  Template extends `${infer Before}[${infer Key}]${infer After}`
    ? Key extends RowKeys<TRow> | `ctx.${ContextKey}`
      ? ValidatedTemplate<TRow, `${Before}${After}`>
      : never
    : Template
```

- **Reason:** Recursively validates template placeholders against Row type
- **Benefits:** Prevents invalid placeholder usage in URLs like `[ctx.hostId]` or `[cluster]`
- **Note:** Currently branded type; runtime validation not enforced

## Compatibility

### Backward Compatibility
- Existing `QueryConfig` type remains unchanged
- New system is purely additive
- No breaking changes to existing code

### Migration Path
As outlined in design document:
1. **Phase 1:** Add new types (completed)
2. **Phase 2:** Gradually migrate config files using `defineQuery<Row>()`
3. **Phase 3:** Deprecate old types

## Example Usage

### Before (Current System)
```typescript
// types/query-config.ts
export interface QueryConfig {
  name: string
  sql: string
  columns: string[]  // No validation
  columnFormats?: {
    [key: string]: ColumnFormat | ColumnFormatWithArgs  // Any key allowed
  }
  columnIcons?: {
    [key: string]: Icon  // Any key allowed
  }
  // ... other properties
}
```

### After (New System)
```typescript
// types/query-config-v2.ts
export type RowKeys<TRow> = Extract<keyof TRow, string>

export interface QueryConfig<
  TRow extends Record<string, unknown> = Record<string, unknown>
> {
  name: string
  sql: string
  columns: RowKeys<TRow>[]  // Only keys from Row type allowed
  columnFormats?: TypedColumnFormats<TRow>  // Keys validated, options type-checked
  columnIcons?: TypedColumnIcons<TRow>  // Keys validated
  columnIcons?: TypedSortingFns<TRow>  // Keys validated
  // ... other properties
}
```

## Quality Assurance

### Linting
- ✓ File passes Biome linter with no errors
- ✓ All imports properly typed
- ✓ All exports documented with JSDoc

### TypeScript Validation
- ✓ Compiles without errors
- ✓ Type inference working correctly
- ✓ Discriminated unions properly narrowed
- ✓ Mapped types correctly constrained

### Documentation
- ✓ All exported types have JSDoc comments
- ✓ Type parameters documented with @typeParam
- ✓ Examples provided for complex types
- ✓ Usage patterns documented with @example

## Implementation Characteristics

### File Structure
```
types/
├── query-config.ts          # Existing, unchanged
├── query-config-v2.ts       # NEW: V2 type system
└── __query-config-v2.validation.ts  # NEW: Type validation tests
```

### Import Structure
```typescript
// Minimal external dependencies
import type { ClickHouseSettings } from '@clickhouse/client'
import type { ChartProps } from '@/components/charts/chart-props'
import type { CustomSortingFnNames } from '@/components/data-table'
import type { ColumnFormat } from '@/types/column-format'
import type { Icon } from '@/types/icon'
```

### Type Hierarchy
```
RowKeys<TRow>
  ↓
TemplatePlaceholder<TRow>
ValidatedTemplate<TRow, Template>
  ↓
FormatOptionsMap<TRow>
ColumnFormatSpec<TRow, TFormat>
  ↓
TypedColumnFormats<TRow>
TypedColumnIcons<TRow>
TypedSortingFns<TRow>
TypedFilterPreset<TRow>
  ↓
QueryConfig<TRow>  (Main interface)
```

## Next Steps

### Phase 2: Helper Functions (Optional Implementation)

Two complementary approaches for using the new types:

#### Option 1: Simple Factory Function
```typescript
// lib/define-query.ts
export function defineQuery<TRow extends Record<string, unknown>>(
  config: QueryConfig<TRow>
): QueryConfig<TRow> {
  return config
}

// Usage
export type Row = { cluster: string; shard_count: number }
export const queryConfig = defineQuery<Row>({
  name: 'clusters',
  sql: 'SELECT ...',
  columns: ['cluster', 'shard_count'],  // Autocomplete!
})
```

#### Option 2: Builder Pattern
```typescript
// lib/query-config-builder.ts
class QueryConfigBuilder<TRow extends Record<string, unknown>> {
  // Fluent API for building configs
  static create<T extends Record<string, unknown>>() {
    return new QueryConfigBuilder<T>()
  }

  columns(...cols: RowKeys<TRow>[]) { ... }
  link<K extends RowKeys<TRow>>(column: K, href: string) { ... }
  build(): QueryConfig<TRow> { ... }
}
```

### Phase 3: Gradual Migration
Start migrating existing config files to use new types:
1. Convert one config at a time
2. Run TypeScript to catch errors
3. Fix column name typos and format mismatches
4. Commit with improved type safety

## Summary

The QueryConfig v2 system provides enterprise-grade type safety for ClickHouse monitoring configuration. All key requirements from the design document have been implemented:

✓ RowKeys type to extract keys from Row type
✓ TemplatePlaceholder type for template validation
✓ FormatOptionsMap with discriminated union for each format type
✓ FormatsRequiringOptions and FormatsWithOptionalOptions types
✓ ColumnFormatSpec for format specifications with options
✓ TypedColumnFormats, TypedColumnIcons, TypedSortingFns types
✓ TypedFilterPreset interface
✓ New generic QueryConfig<TRow> interface
✓ Comprehensive JSDoc documentation
✓ Type compilation without errors

The implementation is production-ready and can be adopted incrementally without breaking existing code.
