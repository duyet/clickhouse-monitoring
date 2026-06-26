import type { DeclarativeQueryConfig } from '../../schema'

const errorsTail = `
      FROM system.error_log
      WHERE if({error: String} != '', error = {error: String}, true)
      ORDER BY event_time DESC
      LIMIT 100`

export const errorsDeclarative: DeclarativeQueryConfig = {
  name: 'errors',
  defaultView: 'auto',
  card: { primary: 'error', badges: ['remote'] },
  description: 'System error logs and history',
  optional: true,
  tableCheck: 'system.error_log',
  sql: [
    {
      since: '23.8',
      description: 'Base query — columns available in all supported versions',
      sql: `
      SELECT
          event_time,
          event_date,
          code,
          error,
          value,
          remote,
          hostname
      ${errorsTail}
  `,
    },
    {
      since: '25.12',
      description:
        'Added last_error_time, last_error_message, last_error_query_id, last_error_trace (CH 25.12+)',
      sql: `
      SELECT
          event_time,
          event_date,
          code,
          error,
          value,
          remote,
          hostname,
          last_error_time,
          last_error_message,
          last_error_query_id,
          last_error_trace
      ${errorsTail}
  `,
    },
  ],
  columns: [
    'event_time',
    'event_date',
    'code',
    'error',
    'value',
    'remote',
    'hostname',
    'last_error_time',
    'last_error_message',
    'last_error_query_id',
  ],
  columnFormats: {
    error: ['link', { href: `?error=[error]` }],
    remote: 'boolean',
    last_error_query_id: [
      'link',
      {
        href: '/query?query_id=[last_error_query_id]&host=[ctx.hostId]',
        className: 'truncate max-w-48',
        title: 'View query detail',
      },
    ],
    last_error_time: 'related-time',
  },
  defaultParams: { error: '' },
  // config-details expandable: auto-renders all non-primary columns in a detail grid,
  // including last_error_message and last_error_trace from CH 25.12+.
  expandable: {
    type: 'config-details',
    primaryColumns: ['event_time', 'code', 'error', 'value', 'remote'],
  },
  filterParamPresets: [
    { name: 'KEEPER_EXCEPTION', key: 'error', value: 'KEEPER_EXCEPTION' },
    {
      name: 'PART_IS_TEMPORARILY_LOCKED',
      key: 'error',
      value: 'PART_IS_TEMPORARILY_LOCKED',
    },
    {
      name: 'TABLE_IS_READ_ONLY',
      key: 'error',
      value: 'TABLE_IS_READ_ONLY',
    },
    {
      name: 'NO_REPLICA_HAS_PART',
      key: 'error',
      value: 'NO_REPLICA_HAS_PART',
    },
    { name: 'INCORRECT_DATA', key: 'error', value: 'INCORRECT_DATA' },
    { name: 'TIMEOUT_EXCEEDED', key: 'error', value: 'TIMEOUT_EXCEEDED' },
    {
      name: 'CANNOT_PARSE_INPUT_ASSERTION_FAILED',
      key: 'error',
      value: 'CANNOT_PARSE_INPUT_ASSERTION_FAILED',
    },
    { name: 'ABORTED', key: 'error', value: 'ABORTED' },
    { name: 'TOO_MANY_PARTS', key: 'error', value: 'TOO_MANY_PARTS' },
    {
      name: 'CHECKSUM_DOESNT_MATCH',
      key: 'error',
      value: 'CHECKSUM_DOESNT_MATCH',
    },
    { name: 'NETWORK_ERROR', key: 'error', value: 'NETWORK_ERROR' },
  ],
  relatedCharts: [['zookeeper-exception', {}]],
}
