/**
 * SQL statement splitting
 *
 * Split a SQL script into individual statements on top-level semicolons.
 *
 * @module @chm/sql-builder/split-statements
 */

/**
 * Decide whether a fragment carries no executable SQL — i.e. it is blank or
 * contains only comments. Used to drop empty trailing fragments (a trailing
 * `;`) and comment-only tails so they are never sent to ClickHouse.
 *
 * The comment stripping here is deliberately naive (it does not re-tokenize
 * strings) because it only ever decides emptiness: a false "non-empty" keeps a
 * fragment (safe), and real SQL can never look entirely like a comment.
 */
function isEffectivelyEmpty(fragment: string): boolean {
  const withoutComments = fragment
    .replace(/--[^\n]*/g, '') // line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .trim()
  return withoutComments.length === 0
}

/**
 * Split a SQL script into individual statements on top-level semicolons.
 *
 * Semicolons inside string literals (`'...'`, `"..."`), quoted identifiers
 * (`` `...` ``), line comments (`-- ...`) and block comments (`/* ... *\/`) are
 * NOT treated as separators. Backslash escapes (`\'`) and doubled-quote escapes
 * (`''`, `""`, ``` `` ```) inside the respective quote contexts are handled.
 *
 * Empty / comment-only fragments are dropped, so:
 * - `SELECT 1;`            → `['SELECT 1']`     (trailing `;` stripped)
 * - `SELECT 1; SELECT 2`   → `['SELECT 1', 'SELECT 2']`
 * - `SELECT ';' AS x`      → `["SELECT ';' AS x"]` (`;` inside a string)
 *
 * This is a lexical splitter, not a full SQL parser — it is intentionally
 * small and dependency-free so it behaves identically in the browser, Node and
 * Cloudflare Workers.
 *
 * @param sql - One or more SQL statements separated by `;`
 * @returns Trimmed, non-empty statements in source order
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let buf = ''
  type State = 'normal' | 'single' | 'double' | 'backtick' | 'line' | 'block'
  let state: State = 'normal'

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    const next = sql[i + 1]

    switch (state) {
      case 'normal': {
        if (ch === ';') {
          statements.push(buf)
          buf = ''
          break
        }
        buf += ch
        if (ch === "'") state = 'single'
        else if (ch === '"') state = 'double'
        else if (ch === '`') state = 'backtick'
        else if (ch === '-' && next === '-') state = 'line'
        else if (ch === '/' && next === '*') state = 'block'
        break
      }
      case 'line': {
        buf += ch
        if (ch === '\n') state = 'normal'
        break
      }
      case 'block': {
        buf += ch
        if (ch === '*' && next === '/') {
          buf += next
          i++
          state = 'normal'
        }
        break
      }
      // Quoted contexts: single / double / backtick.
      default: {
        const quote = state === 'single' ? "'" : state === 'double' ? '"' : '`'
        buf += ch
        if (ch === '\\') {
          // Backslash escape — consume the next char verbatim.
          if (next !== undefined) {
            buf += next
            i++
          }
          break
        }
        if (ch === quote) {
          if (next === quote) {
            // Doubled-quote escape, e.g. '' inside a single-quoted string.
            buf += next
            i++
          } else {
            state = 'normal'
          }
        }
        break
      }
    }
  }

  // Flush the final fragment (input without a trailing ';').
  statements.push(buf)

  return statements.map((s) => s.trim()).filter((s) => !isEffectivelyEmpty(s))
}

/**
 * Strip a trailing ClickHouse `FORMAT <name>` clause and any trailing
 * semicolons from a single SQL statement.
 *
 * `EXPLAIN` cannot wrap a query that carries its own output `FORMAT` clause —
 * ClickHouse reports a format/syntax error — and a trailing `;` likewise breaks
 * the `EXPLAIN <query>` wrapping. This normalizes a statement so it can be
 * safely embedded after `EXPLAIN ...` (e.g. when a query was copied straight
 * from the SQL console with `FORMAT JSONEachRow` still attached).
 *
 * Only a *trailing* FORMAT clause is removed (the one legal position for it in
 * ClickHouse). Occurrences elsewhere — the `formatDateTime` function, a column
 * aliased `format`, or a string literal containing "FORMAT" — are left intact.
 *
 * - `SELECT 1 FORMAT JSONEachRow`  → `SELECT 1`
 * - `SELECT 1 FORMAT JSONEachRow;` → `SELECT 1`
 * - `SELECT 1;`                    → `SELECT 1`
 * - `SELECT formatDateTime(now())` → `SELECT formatDateTime(now())`
 *
 * @param sql - A single SQL statement
 * @returns The statement without a trailing FORMAT clause or semicolons
 */
export function stripTrailingFormat(sql: string): string {
  // Drop trailing semicolon(s) first so a `... FORMAT JSONEachRow;` tail works.
  let out = sql
    .trim()
    .replace(/;+\s*$/, '')
    .trimEnd()
  // Remove a trailing `FORMAT <Identifier>` clause.
  out = out.replace(/\s+FORMAT\s+[A-Za-z0-9_]+\s*$/i, '')
  // Strip again in case removing the FORMAT clause exposed another `;`.
  return out.replace(/;+\s*$/, '').trim()
}
