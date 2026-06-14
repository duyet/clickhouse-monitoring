import type { FormatOptionsWithLanguage } from 'sql-formatter'

import { dedent } from '@/lib/utils'

/**
 * Lazily-loaded `sql-formatter`.
 *
 * `sql-formatter` is ~484K and is only needed when a user toggles the
 * "Beautify" control (off by default). Importing it eagerly shipped that cost
 * to every client even though most sessions never beautify any SQL. We defer
 * the import to the first `formatSql()` call and cache the module-level promise
 * so the chunk is fetched at most once per session.
 */
let formatterPromise: Promise<typeof import('sql-formatter').format> | null =
  null

function loadFormatter(): Promise<typeof import('sql-formatter').format> {
  if (!formatterPromise) {
    formatterPromise = import('sql-formatter').then((mod) => mod.format)
  }
  return formatterPromise
}

/** Default ClickHouse-friendly formatting options. */
const DEFAULT_OPTIONS: FormatOptionsWithLanguage = {
  language: 'sql',
  keywordCase: 'upper',
  identifierCase: 'preserve',
  tabWidth: 2,
  linesBetweenQueries: 2,
}

/**
 * Format SQL using the lazily-loaded `sql-formatter`.
 *
 * On any failure (invalid SQL, import failure) it falls back to the dedented
 * original so callers never have to handle a rejected promise — beautify is a
 * best-effort enhancement, not a hard requirement.
 */
export async function formatSql(
  sql: string,
  opts?: FormatOptionsWithLanguage
): Promise<string> {
  try {
    const format = await loadFormatter()
    return format(sql, { ...DEFAULT_OPTIONS, ...opts })
  } catch {
    return dedent(sql)
  }
}
