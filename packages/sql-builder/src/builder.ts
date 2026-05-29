/**
 * Immutable SQL Query Builder for ClickHouse
 *
 * Provides a fluent API for building SQL queries with type safety.
 * All methods return new instances - no mutation.
 */

import type {
  BuilderState,
  JoinType,
  SqlBuilderLike,
  SqlCondition,
  SqlCte,
  SqlExpression,
  SqlJoin,
  SqlOrder,
  SqlValue,
  WhereGroup,
} from './types'

import { RawSql } from './raw'
import { validateBuilderState } from './validator'

/**
 * Immutable SQL query builder
 */
export class SqlBuilder {
  readonly state: BuilderState

  constructor(state: Partial<BuilderState> = {}) {
    this.state = {
      ctes: state.ctes ?? [],
      columns: state.columns ?? [],
      from: state.from,
      joins: state.joins ?? [],
      wheres: state.wheres ?? [],
      groupBy: state.groupBy ?? [],
      having: state.having ?? [],
      orderBy: state.orderBy ?? [],
      limit: state.limit,
      offset: state.offset,
      unions: state.unions ?? [],
      settings: state.settings ?? {},
      format: state.format,
    }
  }

  /**
   * Clone builder with changes - ensures immutability
   */
  private clone(changes: Partial<BuilderState>): SqlBuilder {
    return new SqlBuilder({
      ...this.state,
      ...changes,
    })
  }

  /**
   * Add columns to SELECT clause
   * @example
   * sql.select('id', 'name')
   * sql.select('COUNT(*)')
   */
  select(...columns: SqlExpression[]): SqlBuilder {
    return this.clone({
      columns: [...this.state.columns, ...columns],
    })
  }

  /**
   * Add raw SQL to SELECT clause
   * @example
   * sql.selectRaw('COUNT(DISTINCT user_id) as users')
   */
  selectRaw(sql: string): SqlBuilder {
    return this.select(new RawSql(sql))
  }

  /**
   * Set FROM clause
   * @example
   * sql.from('users')
   * sql.from('users', 'u')
   * sql.from(subquery, 'sub')
   */
  from(table: string | SqlBuilderLike, alias?: string): SqlBuilder {
    return this.clone({
      from: { table, alias },
    })
  }

  /**
   * Add WHERE condition
   * @example
   * sql.where('age', '>', 18)
   * sql.where('status', '=', 'active')
   * sql.where(q => q.where('a', '=', 1).orWhere('b', '=', 2))
   */
  where(
    column: string | ((q: SqlBuilder) => SqlBuilder),
    operator?: string,
    value?: SqlValue
  ): SqlBuilder {
    // Grouped WHERE
    if (typeof column === 'function') {
      const grouped = column(new SqlBuilder())
      if (grouped.state.wheres.length === 0) {
        return this
      }
      return this.clone({
        wheres: [
          ...this.state.wheres,
          {
            conditions: grouped.state.wheres,
            type: 'and' as const,
          } satisfies WhereGroup,
        ],
      })
    }

    // Regular WHERE
    if (operator === undefined || value === undefined) {
      throw new Error('WHERE clause requires column, operator, and value')
    }

    return this.clone({
      wheres: [
        ...this.state.wheres,
        {
          column,
          operator,
          value,
          type: 'and' as const,
        } satisfies SqlCondition,
      ],
    })
  }

  /**
   * Add OR WHERE condition
   * @example
   * sql.where('a', '=', 1).orWhere('b', '=', 2)
   */
  orWhere(column: string, operator: string, value: SqlValue): SqlBuilder {
    return this.clone({
      wheres: [
        ...this.state.wheres,
        {
          column,
          operator,
          value,
          type: 'or' as const,
        } satisfies SqlCondition,
      ],
    })
  }

  /**
   * Add raw WHERE condition
   * @example
   * sql.whereRaw('age > 18 AND status = "active"')
   */
  whereRaw(sql: string): SqlBuilder {
    return this.clone({
      wheres: [
        ...this.state.wheres,
        {
          column: '',
          operator: '',
          value: new RawSql(sql),
          type: 'and' as const,
        } satisfies SqlCondition,
      ],
    })
  }

  /**
   * Add ORDER BY clause
   * @example
   * sql.orderBy('created_at', 'DESC')
   * sql.orderBy('name')
   */
  orderBy(
    column: string,
    direction: 'ASC' | 'DESC' = 'ASC',
    nulls?: 'FIRST' | 'LAST'
  ): SqlBuilder {
    return this.clone({
      orderBy: [
        ...this.state.orderBy,
        { column, direction, nulls } satisfies SqlOrder,
      ],
    })
  }

  /**
   * Add raw ORDER BY clause
   * @example
   * sql.orderByRaw('created_at DESC NULLS LAST')
   */
  orderByRaw(sql: string): SqlBuilder {
    return this.clone({
      orderBy: [
        ...this.state.orderBy,
        {
          column: new RawSql(sql),
          direction: 'ASC' as const,
        } satisfies SqlOrder,
      ],
    })
  }

  /**
   * Add GROUP BY clause
   * @example
   * sql.groupBy('user_id', 'date')
   */
  groupBy(...columns: string[]): SqlBuilder {
    return this.clone({
      groupBy: [...this.state.groupBy, ...columns],
    })
  }

  /**
   * Add HAVING condition
   * @example
   * sql.having('COUNT(*)', '>', 10)
   */
  having(
    column: string | ((q: SqlBuilder) => SqlBuilder),
    operator?: string,
    value?: SqlValue
  ): SqlBuilder {
    // Grouped HAVING
    if (typeof column === 'function') {
      const grouped = column(new SqlBuilder())
      if (grouped.state.wheres.length === 0) {
        return this
      }
      return this.clone({
        having: [
          ...this.state.having,
          {
            conditions: grouped.state.wheres,
            type: 'and' as const,
          } satisfies WhereGroup,
        ],
      })
    }

    // Regular HAVING
    if (operator === undefined || value === undefined) {
      throw new Error('HAVING clause requires column, operator, and value')
    }

    return this.clone({
      having: [
        ...this.state.having,
        {
          column,
          operator,
          value,
          type: 'and' as const,
        } satisfies SqlCondition,
      ],
    })
  }

  /**
   * Add raw HAVING condition
   * @example
   * sql.havingRaw('COUNT(*) > 10')
   */
  havingRaw(sql: string): SqlBuilder {
    return this.clone({
      having: [
        ...this.state.having,
        {
          column: '',
          operator: '',
          value: new RawSql(sql),
          type: 'and' as const,
        } satisfies SqlCondition,
      ],
    })
  }

  /**
   * Set LIMIT clause
   * @example
   * sql.limit(100)
   */
  limit(n: number): SqlBuilder {
    return this.clone({ limit: n })
  }

  /**
   * Set OFFSET clause
   * @example
   * sql.offset(50)
   */
  offset(n: number): SqlBuilder {
    return this.clone({ offset: n })
  }

  /**
   * Add Common Table Expression (CTE)
   * @example
   * sql.with('active_users', sql.select('*').from('users').where('status', '=', 'active'))
   */
  with(name: string, query: SqlBuilderLike): SqlBuilder {
    return this.clone({
      ctes: [...this.state.ctes, { name, query } satisfies SqlCte],
    })
  }

  /**
   * Add JOIN clause
   * @example
   * sql.join('INNER', 'orders', 'o', 'o.user_id = u.id')
   * sql.join('LEFT', 'orders', 'o', { using: ['user_id'] })
   */
  private addJoin(
    type: JoinType,
    table: string | SqlBuilderLike,
    alias?: string,
    condition?: string | { using: string[] }
  ): SqlBuilder {
    const join: SqlJoin = {
      type,
      table,
      alias,
    }

    if (typeof condition === 'string') {
      join.condition = condition
    } else if (condition && 'using' in condition) {
      join.using = condition.using
    }

    return this.clone({
      joins: [...this.state.joins, join],
    })
  }

  /**
   * Add INNER JOIN
   * @example
   * sql.join('orders', 'o', 'o.user_id = u.id')
   */
  join(
    table: string | SqlBuilderLike,
    alias?: string,
    condition?: string | { using: string[] }
  ): SqlBuilder {
    return this.addJoin('INNER', table, alias, condition)
  }

  /**
   * Add LEFT JOIN
   * @example
   * sql.leftJoin('orders', 'o', 'o.user_id = u.id')
   */
  leftJoin(
    table: string | SqlBuilderLike,
    alias?: string,
    condition?: string | { using: string[] }
  ): SqlBuilder {
    return this.addJoin('LEFT', table, alias, condition)
  }

  /**
   * Add RIGHT JOIN
   * @example
   * sql.rightJoin('orders', 'o', 'o.user_id = u.id')
   */
  rightJoin(
    table: string | SqlBuilderLike,
    alias?: string,
    condition?: string | { using: string[] }
  ): SqlBuilder {
    return this.addJoin('RIGHT', table, alias, condition)
  }

  /**
   * Add FULL JOIN
   * @example
   * sql.fullJoin('orders', 'o', 'o.user_id = u.id')
   */
  fullJoin(
    table: string | SqlBuilderLike,
    alias?: string,
    condition?: string | { using: string[] }
  ): SqlBuilder {
    return this.addJoin('FULL', table, alias, condition)
  }

  /**
   * Add ARRAY JOIN (ClickHouse specific)
   * @example
   * sql.arrayJoin('tags')
   */
  arrayJoin(column: string): SqlBuilder {
    return this.addJoin('ARRAY', column)
  }

  /**
   * Add UNION query
   * @example
   * sql.union(otherQuery)
   */
  union(query: SqlBuilderLike): SqlBuilder {
    return this.clone({
      unions: [...this.state.unions, { query, all: false }],
    })
  }

  /**
   * Add UNION ALL query
   * @example
   * sql.unionAll(otherQuery)
   */
  unionAll(query: SqlBuilderLike): SqlBuilder {
    return this.clone({
      unions: [...this.state.unions, { query, all: true }],
    })
  }

  /**
   * Add ClickHouse SETTINGS clause
   * @example
   * sql.settings({ max_execution_time: 60 })
   */
  settings(opts: Record<string, unknown>): SqlBuilder {
    return this.clone({
      settings: { ...this.state.settings, ...opts },
    })
  }

  /**
   * Set ClickHouse FORMAT clause
   * @example
   * sql.format('JSONEachRow')
   */
  format(fmt: string): SqlBuilder {
    return this.clone({ format: fmt })
  }

  /**
   * Creates ExtendedBuilder for version-aware query modifications
   *
   * Enables version inheritance where newer ClickHouse versions can extend
   * base queries with modifications. Supports unlimited extension depth.
   *
   * @returns ExtendedBuilder instance for chaining modifications
   *
   * @example
   * ```typescript
   * // Base query for v23
   * const v23 = sql()
   *   .select('query', 'user', 'memory_usage')
   *   .from('system.processes')
   *
   * // v24: Add new column + filter
   * const v24 = v23
   *   .extend()
   *   .addColumn('peak_threads_usage')
   *   .addWhere('peak_threads_usage', '>', 0)
   *
   * // v25: Chain from v24
   * const v25 = v24
   *   .extend()
   *   .addColumn('hostname')
   *   .changeOrderBy('memory_usage', 'DESC')
   * ```
   */
  extend() {
    // Lazy import to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ExtendedBuilder } = require('./extension')
    return new ExtendedBuilder(this)
  }

  /**
   * Build SQL query (minified)
   * @throws SqlBuilderError if query is invalid
   */
  build(): string {
    validateBuilderState(this.state)
    return this.buildInternal(false)
  }

  /**
   * Build SQL query (formatted)
   * @throws SqlBuilderError if query is invalid
   */
  buildPretty(): string {
    validateBuilderState(this.state)
    return this.buildInternal(true)
  }

  /**
   * Internal build implementation
   */
  private buildInternal(pretty: boolean): string {
    const nl = pretty ? '\n' : ' '
    const indent = pretty ? '  ' : ''
    const parts: string[] = []

    // WITH (CTEs)
    if (this.state.ctes.length > 0) {
      const ctes = this.state.ctes
        .map((cte) => `${cte.name} AS (${cte.query.build()})`)
        .join(`, ${nl}${indent}`)
      parts.push(`WITH ${ctes}`)
    }

    // SELECT
    const columns =
      this.state.columns.length > 0
        ? this.state.columns.map((col) => this.formatExpression(col)).join(', ')
        : '*'
    parts.push(`SELECT ${columns}`)

    // FROM
    if (this.state.from) {
      const fromClause = this.formatFrom(this.state.from)
      parts.push(`FROM ${fromClause}`)
    }

    // JOINs
    for (const join of this.state.joins) {
      parts.push(this.formatJoin(join))
    }

    // WHERE
    if (this.state.wheres.length > 0) {
      const whereClause = this.formatConditions(this.state.wheres)
      parts.push(`WHERE ${whereClause}`)
    }

    // GROUP BY
    if (this.state.groupBy.length > 0) {
      parts.push(`GROUP BY ${this.state.groupBy.join(', ')}`)
    }

    // HAVING
    if (this.state.having.length > 0) {
      const havingClause = this.formatConditions(this.state.having)
      parts.push(`HAVING ${havingClause}`)
    }

    // ORDER BY
    if (this.state.orderBy.length > 0) {
      const orders = this.state.orderBy.map((order) => this.formatOrder(order))
      parts.push(`ORDER BY ${orders.join(', ')}`)
    }

    // LIMIT
    if (this.state.limit !== undefined) {
      parts.push(`LIMIT ${this.state.limit}`)
    }

    // OFFSET
    if (this.state.offset !== undefined) {
      parts.push(`OFFSET ${this.state.offset}`)
    }

    // UNION
    let query = parts.join(nl)
    for (const union of this.state.unions) {
      const unionType = union.all ? 'UNION ALL' : 'UNION'
      query += `${nl}${unionType}${nl}${union.query.build()}`
    }

    // SETTINGS
    if (Object.keys(this.state.settings).length > 0) {
      const settings = Object.entries(this.state.settings)
        .map(([key, value]) => `${key} = ${this.formatValue(value)}`)
        .join(', ')
      query += `${nl}SETTINGS ${settings}`
    }

    // FORMAT
    if (this.state.format) {
      query += `${nl}FORMAT ${this.state.format}`
    }

    return query
  }

  /**
   * Format expression (column, raw SQL, etc.)
   */
  private formatExpression(expr: SqlExpression): string {
    if (typeof expr === 'string') {
      return expr
    }
    // SqlFragment (RawSql, ColumnBuilder, etc.)
    return expr.toSql()
  }

  /**
   * Format FROM clause
   */
  private formatFrom(from: {
    table: string | SqlBuilderLike
    alias?: string
  }): string {
    let result: string

    if (typeof from.table === 'string') {
      result = from.table
    } else {
      result = `(${from.table.build()})`
    }

    if (from.alias) {
      result += ` AS ${from.alias}`
    }

    return result
  }

  /**
   * Format JOIN clause
   */
  private formatJoin(join: SqlJoin): string {
    let result = `${join.type} JOIN `

    if (typeof join.table === 'string') {
      result += join.table
    } else {
      result += `(${join.table.build()})`
    }

    if (join.alias) {
      result += ` AS ${join.alias}`
    }

    if (join.using) {
      result += ` USING (${join.using.join(', ')})`
    } else if (join.condition) {
      result += ` ON ${join.condition}`
    }

    return result
  }

  /**
   * Format conditions (WHERE/HAVING)
   */
  private formatConditions(
    conditions: (SqlCondition | WhereGroup)[],
    level = 0
  ): string {
    const parts: string[] = []

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]
      const isFirst = i === 0

      if ('conditions' in condition) {
        // WhereGroup
        const grouped = this.formatConditions(condition.conditions, level + 1)
        const connector = isFirst ? '' : ` ${condition.type.toUpperCase()} `
        parts.push(`${connector}(${grouped})`)
      } else {
        // SqlCondition
        const connector = isFirst ? '' : ` ${condition.type.toUpperCase()} `

        // Raw SQL condition
        if (
          condition.value &&
          typeof condition.value === 'object' &&
          'toSql' in condition.value
        ) {
          parts.push(`${connector}${condition.value.toSql()}`)
        } else {
          // Regular condition
          const value = this.formatValue(condition.value)
          parts.push(
            `${connector}${condition.column} ${condition.operator} ${value}`
          )
        }
      }
    }

    return parts.join('')
  }

  /**
   * Format ORDER BY clause
   */
  private formatOrder(order: SqlOrder): string {
    let result: string

    if (typeof order.column === 'object') {
      // SqlFragment (RawSql)
      result = order.column.toSql()
    } else {
      result = `${order.column} ${order.direction}`
      if (order.nulls) {
        result += ` NULLS ${order.nulls}`
      }
    }

    return result
  }

  /**
   * Format value for SQL
   */
  private formatValue(value: unknown): string {
    if (value === null) {
      return 'NULL'
    }
    if (typeof value === 'string') {
      // Escape single quotes
      return `'${value.replace(/'/g, "''")}'`
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0'
    }
    if (typeof value === 'number') {
      return String(value)
    }
    if (typeof value === 'object' && 'toSql' in value) {
      return (value as any).toSql()
    }
    return String(value)
  }
}

/**
 * Factory function for creating new SQL builder instances
 */
export function sql(): SqlBuilder {
  return new SqlBuilder()
}
