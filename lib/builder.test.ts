import { ColumnFormat } from '@/types/column-format'
import { QueryConfigBuilder, defineQuery } from './query-config-builder'

// Define test row type
type TestRow = {
  cluster: string
  shard_count: number
  replica_count: number
  replica_status: string
}

describe('QueryConfigBuilder', () => {
  describe('static create method', () => {
    it('creates a new builder instance', () => {
      const builder = QueryConfigBuilder.create<TestRow>()
      expect(builder).toBeInstanceOf(QueryConfigBuilder)
    })
  })

  describe('name method', () => {
    it('sets the configuration name', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test-config')
        .sql('SELECT 1')
        .columns('cluster')
        .build()
      expect(config.name).toBe('test-config')
    })

    it('supports method chaining', () => {
      const builder = QueryConfigBuilder.create<TestRow>()
      const result = builder.name('test')
      expect(result).toBe(builder)
    })
  })

  describe('description method', () => {
    it('sets the configuration description', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .description('Test description')
        .sql('SELECT 1')
        .columns('cluster')
        .build()
      expect(config.description).toBe('Test description')
    })
  })

  describe('sql method', () => {
    it('sets the SQL query', () => {
      const sql = 'SELECT * FROM system.clusters'
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql(sql)
        .columns('cluster')
        .build()
      expect(config.sql).toBe(sql)
    })
  })

  describe('columns method', () => {
    it('accepts multiple column names', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster', 'shard_count', 'replica_count')
        .build()
      expect(config.columns).toEqual([
        'cluster',
        'shard_count',
        'replica_count',
      ])
    })

    it('accepts single column', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .build()
      expect(config.columns).toEqual(['cluster'])
    })
  })

  describe('format method', () => {
    it('adds column format without options', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .format('cluster', ColumnFormat.Badge)
        .build()
      expect(config.columnFormats?.cluster).toBe(ColumnFormat.Badge)
    })

    it('adds column format with options', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .format('cluster', ColumnFormat.Link, { href: '/clusters/[cluster]' })
        .build()
      expect(config.columnFormats?.cluster).toEqual([
        ColumnFormat.Link,
        { href: '/clusters/[cluster]' },
      ])
    })
  })

  describe('link convenience method', () => {
    it('adds link format with href', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .link('cluster', '/clusters/[cluster]')
        .build()
      expect(config.columnFormats?.cluster).toEqual([
        ColumnFormat.Link,
        { href: '/clusters/[cluster]' },
      ])
    })

    it('supports external option', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .link('cluster', 'https://example.com', { external: true })
        .build()
      expect(config.columnFormats?.cluster).toEqual([
        ColumnFormat.Link,
        { href: 'https://example.com', external: true },
      ])
    })
  })

  describe('actions convenience method', () => {
    it('adds action format with actions array', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .actions('cluster', ['kill-query', 'optimize'])
        .build()
      expect(config.columnFormats?.cluster).toEqual([
        ColumnFormat.Action,
        ['kill-query', 'optimize'],
      ])
    })
  })

  describe('icon method', () => {
    it('adds column icon', () => {
      const mockIcon = () => null
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .icon('cluster', mockIcon as any)
        .build()
      expect(config.columnIcons?.cluster).toBe(mockIcon)
    })

    it('initializes columnIcons if not present', () => {
      const mockIcon = () => null
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .icon('cluster', mockIcon as any)
        .icon('shard_count', mockIcon as any)
        .build()
      expect(Object.keys(config.columnIcons || {})).toHaveLength(2)
    })
  })

  describe('sortBy method', () => {
    it('adds sorting function', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .sortBy('shard_count', 'sort_column_using_actual_value')
        .build()
      expect(config.sortingFns?.shard_count).toBe(
        'sort_column_using_actual_value'
      )
    })

    it('initializes sortingFns if not present', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .sortBy('cluster', 'sort_column_using_actual_value')
        .sortBy('shard_count', 'sort_column_using_actual_value')
        .build()
      expect(Object.keys(config.sortingFns || {})).toHaveLength(2)
    })
  })

  describe('charts method', () => {
    it('adds related charts', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .charts('disk-size', 'memory-usage')
        .build()
      expect(config.relatedCharts).toEqual(['disk-size', 'memory-usage'])
    })

    it('replaces previous charts', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .charts('chart1', 'chart2')
        .charts('chart3')
        .build()
      expect(config.relatedCharts).toEqual(['chart3'])
    })
  })

  describe('optional method', () => {
    it('marks configuration as optional', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .optional()
        .build()
      expect(config.optional).toBe(true)
    })

    it('sets table check when provided', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .optional('system.backup_log')
        .build()
      expect(config.tableCheck).toBe('system.backup_log')
    })

    it('supports multiple table checks', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .optional(['system.backup_log', 'system.error_log'])
        .build()
      expect(config.tableCheck).toEqual([
        'system.backup_log',
        'system.error_log',
      ])
    })
  })

  describe('defaultParams method', () => {
    it('sets default parameters', () => {
      const params = { database: 'default', limit: 100 }
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .defaultParams(params)
        .build()
      expect(config.defaultParams).toEqual(params)
    })
  })

  describe('settings method', () => {
    it('sets ClickHouse settings', () => {
      const settings = { readonly: 1, max_rows_to_read: 1000000 }
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .settings(settings as any)
        .build()
      expect(config.clickhouseSettings).toEqual(settings)
    })
  })

  describe('docs method', () => {
    it('sets documentation URL', () => {
      const docsUrl = 'https://clickhouse.com/docs/backup'
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .docs(docsUrl)
        .build()
      expect(config.docs).toBe(docsUrl)
    })
  })

  describe('disableSqlValidation method', () => {
    it('disables SQL validation when true', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .disableSqlValidation(true)
        .build()
      expect(config.disableSqlValidation).toBe(true)
    })

    it('defaults to true when called without argument', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .disableSqlValidation()
        .build()
      expect(config.disableSqlValidation).toBe(true)
    })
  })

  describe('build method', () => {
    it('throws error when name is not set', () => {
      expect(() => {
        QueryConfigBuilder.create<TestRow>()
          .sql('SELECT 1')
          .columns('cluster')
          .build()
      }).toThrow('name is required')
    })

    it('throws error when sql is not set', () => {
      expect(() => {
        QueryConfigBuilder.create<TestRow>()
          .name('test')
          .columns('cluster')
          .build()
      }).toThrow('sql is required')
    })

    it('throws error when columns are not set', () => {
      expect(() => {
        QueryConfigBuilder.create<TestRow>()
          .name('test')
          .sql('SELECT 1')
          .build()
      }).toThrow('columns are required')
    })

    it('throws error when columns array is empty', () => {
      expect(() => {
        QueryConfigBuilder.create<TestRow>()
          .name('test')
          .sql('SELECT 1')
          .columns()
          .build()
      }).toThrow('columns are required')
    })

    it('returns valid configuration when all required fields are set', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('test')
        .sql('SELECT 1')
        .columns('cluster')
        .build()
      expect(config).toEqual({
        name: 'test',
        sql: 'SELECT 1',
        columns: ['cluster'],
      })
    })
  })

  describe('method chaining', () => {
    it('supports complete fluent interface', () => {
      const config = QueryConfigBuilder.create<TestRow>()
        .name('complete-test')
        .description('A complete test configuration')
        .sql('SELECT cluster, shard_count FROM system.clusters')
        .columns('cluster', 'shard_count', 'replica_count')
        .link('cluster', '/clusters/[cluster]')
        .actions('cluster', ['optimize'])
        .sortBy('shard_count', 'sort_column_using_actual_value')
        .charts('disk-size')
        .optional('system.clusters')
        .defaultParams({ db: 'system' })
        .docs('https://example.com/docs')
        .disableSqlValidation(false)
        .build()

      expect(config.name).toBe('complete-test')
      expect(config.description).toBe('A complete test configuration')
      expect(config.sql).toBe(
        'SELECT cluster, shard_count FROM system.clusters'
      )
      expect(config.columns).toEqual([
        'cluster',
        'shard_count',
        'replica_count',
      ])
      expect(config.optional).toBe(true)
      expect(config.tableCheck).toBe('system.clusters')
    })
  })

  describe('defineQuery factory function', () => {
    it('creates a builder using factory function', () => {
      const config = defineQuery<TestRow>()
        .name('factory-test')
        .sql('SELECT 1')
        .columns('cluster')
        .build()
      expect(config.name).toBe('factory-test')
    })

    it('is alias for QueryConfigBuilder.create', () => {
      expect(defineQuery).toBe(QueryConfigBuilder.create)
    })
  })
})
