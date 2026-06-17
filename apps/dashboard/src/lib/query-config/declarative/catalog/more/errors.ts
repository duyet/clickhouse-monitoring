import type { DeclarativeQueryConfig } from '../../schema'

export const errorsDeclarative: DeclarativeQueryConfig = {
  name: 'errors',
  defaultView: 'auto',
  card: { primary: 'error', badges: ['remote'] },
  description: 'System error logs and history',
  optional: true,
  tableCheck: 'system.error_log',
  sql: `
      SELECT *
      FROM system.error_log
      WHERE if({error: String} != '', error = {error: String}, true)
      ORDER BY event_time DESC
      LIMIT 100
  `,
  columns: [
    'event_time',
    'event_date',
    'code',
    'error',
    'value',
    'remote',
    'hostname',
  ],
  columnFormats: {
    error: ['link', { href: `?error=[error]` }],
    remote: 'boolean',
  },
  defaultParams: { error: '' },
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
