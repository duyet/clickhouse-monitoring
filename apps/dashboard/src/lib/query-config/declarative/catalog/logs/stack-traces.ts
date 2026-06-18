import type { DeclarativeQueryConfig } from '../../schema'

export const stackTracesDeclarative: DeclarativeQueryConfig = {
  name: 'stack-traces',
  optional: false,
  description: 'Current stack traces for all server threads',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/stack_trace',
  // system.stack_trace is always available, not optional
  sql: `
    SELECT
      thread_name,
      thread_id,
      query_id,
      arrayStringConcat(
        arrayMap(x -> demangle(addressToSymbol(x)), trace),
        '\\n'
      ) as stack_trace
    FROM system.stack_trace
    ORDER BY thread_name
  `,
  clickhouseSettings: {
    allow_introspection_functions: 1,
  },
  columns: ['thread_name', 'thread_id', 'query_id', 'stack_trace'],
  columnFormats: {
    thread_name: 'colored-badge',
    thread_id: 'number',
    query_id: [
      'link',
      {
        href: '/query?query_id=[query_id]&host=[ctx.hostId]',
        className: 'max-w-24 truncate',
      },
    ],
    stack_trace: [
      'code-dialog',
      { max_truncate: 50, dialog_title: 'Stack Trace' },
    ],
  },
}
