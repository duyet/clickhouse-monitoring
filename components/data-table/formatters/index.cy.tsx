import type { Row, RowData, Table } from '@tanstack/react-table'

import {
  badgeFormatter,
  booleanFormatter,
  codeDialogFormatter,
  codeFormatter,
  coloredBadgeFormatter,
  durationFormatter,
  formatCell,
  linkFormatter,
  markdownFormatter,
  numberFormatter,
  relatedTimeFormatter,
  runningQuerySummaryFormatter,
  textFormatter,
} from './index'
import { HostProvider } from '@/lib/swr/host-context'
import { ColumnFormat } from '@/types/column-format'

// Test wrapper with required context
function TestWrapper({
  children,
  hostId = 0,
}: {
  children: React.ReactNode
  hostId?: number
}) {
  return (
    <HostProvider hostId={hostId}>
      <div className="p-4">{children}</div>
    </HostProvider>
  )
}

describe('Formatters Module', () => {
  // Helper to create mock props
  const createMockProps = <TData extends RowData, TValue>(
    value: TValue,
    overrides?: Partial<{
      table: Table<TData>
      data: TData[]
      row: Row<TData>
      context: Record<string, string>
    }>
  ) => {
    return {
      table: {} as Table<TData>,
      data: [],
      row: {
        original: {},
        index: 0,
        getValue: (_key: string) => undefined,
      } as unknown as Row<TData>,
      value,
      columnName: 'test_column',
      context: {},
      ...overrides,
    }
  }

  describe('Inline Formatters', () => {
    it('codeFormatter should wrap value in code tag', () => {
      cy.mount(<TestWrapper>{codeFormatter('user_id')}</TestWrapper>)
      cy.get('code').should('contain.text', 'user_id')
    })

    it('numberFormatter should format large numbers', () => {
      cy.mount(<TestWrapper>{numberFormatter(1234567)}</TestWrapper>)
      cy.contains(/[0-9]+[KMB]?/).should('exist')
    })

    it('numberFormatter should use short format for display', () => {
      cy.mount(<TestWrapper>{numberFormatter(1_500_000)}</TestWrapper>)
      cy.get('span').should('contain.text', '1,500,000')
    })
  })

  describe('Value Formatters', () => {
    it('badgeFormatter should display styled badge', () => {
      cy.mount(<TestWrapper>{badgeFormatter('completed')}</TestWrapper>)
      cy.get('span[class*="rounded-full"]')
        .should('exist')
        .and('contain.text', 'completed')
    })

    it('booleanFormatter should show check icon for true values', () => {
      cy.mount(<TestWrapper>{booleanFormatter(true)}</TestWrapper>)
      cy.get('[aria-label="yes"]').should('exist')
    })

    it('booleanFormatter should show cross icon for false values', () => {
      cy.mount(<TestWrapper>{booleanFormatter(false)}</TestWrapper>)
      cy.get('[aria-label="no"]').should('exist')
    })

    it('booleanFormatter should handle string "true"', () => {
      cy.mount(<TestWrapper>{booleanFormatter('true')}</TestWrapper>)
      cy.get('[aria-label="yes"]').should('exist')
    })

    it('durationFormatter should convert seconds to human-readable', () => {
      cy.mount(<TestWrapper>{durationFormatter(120)}</TestWrapper>)
      cy.contains(/minutes?/).should('exist')
    })

    it('relatedTimeFormatter should show relative time', () => {
      const now = new Date().toISOString()
      cy.mount(<TestWrapper>{relatedTimeFormatter(now)}</TestWrapper>)
      cy.contains(/ago|just now/).should('exist')
    })

    it('textFormatter should display plain text', () => {
      cy.mount(<TestWrapper>{textFormatter('Sample text')}</TestWrapper>)
      cy.contains('Sample text').should('exist')
    })
  })

  describe('Context Formatters', () => {
    it('linkFormatter should create clickable link', () => {
      const props = createMockProps('Click me', {
        row: {
          original: { database: 'system', table: 'users' },
          index: 0,
          getValue: (key: string) => {
            const data: Record<string, string> = {
              database: 'system',
              table: 'users',
            }
            return data[key]
          },
        } as unknown as Row<any>,
        data: [{ database: 'system', table: 'users' }],
        context: {},
      })

      const result = linkFormatter({
        ...props,
        options: { href: '/database/[database]/[table]' },
      })
      cy.mount(<TestWrapper>{result}</TestWrapper>)
      cy.get('a[href="/database/system/users"]')
        .should('exist')
        .and('contain.text', 'Click me')
    })

    it('linkFormatter should render a navigable anchor', () => {
      const props = createMockProps('Navigate', {
        row: {
          original: { id: '123' },
          index: 0,
          getValue: () => '123',
        } as unknown as Row<any>,
        data: [{ id: '123' }],
      })

      const result = linkFormatter({
        ...props,
        options: { href: '/details/[id]' },
      })
      cy.mount(<TestWrapper>{result}</TestWrapper>)

      cy.get('a[href="/details/123"]').should('contain.text', 'Navigate')
    })

    it('runningQuerySummaryFormatter should render a responsive process summary', () => {
      cy.viewport(390, 700)

      const rowData = {
        query_id: '98e83379-9adb-4c1d-9ad3-111111111111',
        query:
          'SELECT database, table, count() FROM system.parts WHERE active GROUP BY database, table ORDER BY count() DESC',
        query_kind: 'Select',
        user: 'duyet',
        current_database: 'system',
        readable_elapsed: '12 seconds',
        readable_memory_usage: '42 MiB',
        progress: '64%',
        readable_read_rows: '12.4M',
        readable_read_bytes: '3.2 GiB',
        readable_written_rows: '0',
        readable_written_bytes: '0 Bytes',
        peak_threads_usage: 8,
        client_name: 'ClickHouse',
        client_hostname: 'workstation',
        interface_label: 'HTTP',
        address: '127.0.0.1',
        port: 8123,
        normalized_query_hash: '123456789',
      }

      const props = createMockProps(rowData.query, {
        row: {
          original: rowData,
          index: 0,
          getValue: (key: string) =>
            rowData[key as keyof typeof rowData] as unknown,
        } as unknown as Row<any>,
        data: [rowData],
      })

      const result = runningQuerySummaryFormatter(props)
      cy.mount(<TestWrapper hostId={2}>{result}</TestWrapper>)

      cy.get('[data-slot="running-query-summary"]').should(($summary) => {
        expect($summary[0].scrollWidth).to.be.lte($summary[0].clientWidth + 1)
      })
      cy.contains('duyet').should('exist')
      cy.contains('42 MiB').should('exist')
      cy.contains('Peak threads').should('exist')
      cy.contains('8').should('exist')
      cy.get(
        'a[href="/query?query_id=98e83379-9adb-4c1d-9ad3-111111111111&host=2"]'
      ).should('exist')
    })

    it('runningQuerySummaryFormatter should render without peak thread data', () => {
      const rowData = {
        query_id: '49bc477a-dc31-4c1d-9ad3-222222222222',
        query: 'SELECT 1',
        user: 'duyet',
        readable_elapsed: '1.5 seconds',
        readable_memory_usage: '12 MiB',
        thread_count: 3,
      }

      const props = createMockProps(rowData.query, {
        row: {
          original: rowData,
          index: 0,
          getValue: (key: string) =>
            rowData[key as keyof typeof rowData] as unknown,
        } as unknown as Row<any>,
        data: [rowData],
      })

      const result = runningQuerySummaryFormatter(props)
      cy.mount(<TestWrapper hostId={3}>{result}</TestWrapper>)

      cy.contains('duyet').should('exist')
      cy.contains('12 MiB').should('exist')
      cy.contains('Threads').should('exist')
      cy.contains('Peak threads').should('not.exist')
      cy.get(
        'a[href="/query?query_id=49bc477a-dc31-4c1d-9ad3-222222222222&host=3"]'
      ).should('exist')
    })
  })

  describe('Advanced Formatters', () => {
    it('codeDialogFormatter should show truncated code for long content', () => {
      const longCode = 'SELECT * FROM table WHERE column = '.repeat(10)
      cy.mount(<TestWrapper>{codeDialogFormatter(longCode)}</TestWrapper>)

      cy.get('code').should('contain.text', '...')
      cy.get('code.truncated')
        .closest('button')
        .should('have.attr', 'type', 'button')
        .and('be.enabled')
    })

    it('codeDialogFormatter should show dialog trigger for long code', () => {
      const longQuery = 'SELECT * FROM users WHERE id = 1'.repeat(5)
      cy.mount(<TestWrapper>{codeDialogFormatter(longQuery)}</TestWrapper>)

      cy.get('code.truncated').closest('button').click()
      cy.get('[role="dialog"]').should('exist')
    })

    it('markdownFormatter should render markdown content', () => {
      cy.mount(
        <TestWrapper>{markdownFormatter('**Bold** and *italic*')}</TestWrapper>
      )

      cy.get('strong').should('contain.text', 'Bold')
      cy.get('em').should('contain.text', 'italic')
    })

    it('coloredBadgeFormatter should display colored badge', () => {
      cy.mount(
        <TestWrapper>{coloredBadgeFormatter('status_value')}</TestWrapper>
      )

      cy.get('span[class*="rounded-full"]')
        .should('exist')
        .and('contain.text', 'status_value')
        .invoke('attr', 'class')
        .should('match', /bg-\w+-100/)
    })

    it('coloredBadgeFormatter should use consistent color for same value', () => {
      const value = 'consistent_value'
      const badge1 = coloredBadgeFormatter(value)
      const badge2 = coloredBadgeFormatter(value)

      const className1 = (badge1 as React.ReactElement).props?.className ?? ''
      const className2 = (badge2 as React.ReactElement).props?.className ?? ''
      const colorClass1 = className1.match(/bg-\w+-100/)?.[0]
      const colorClass2 = className2.match(/bg-\w+-100/)?.[0]
      expect(colorClass1).to.equal(colorClass2)
    })
  })

  describe('formatCell - Main Entry Point', () => {
    const mockTable = {} as Table<any>
    const mockData: any[] = []
    const mockRow = {
      original: {},
      index: 0,
      getValue: () => undefined,
    } as Row<any>

    it('should use inline formatter for Code format', () => {
      const result = formatCell(
        mockTable,
        mockData,
        mockRow,
        'query_text',
        'query',
        {},
        ColumnFormat.Code
      )
      cy.mount(<TestWrapper>{result}</TestWrapper>)
      cy.get('code').should('contain.text', 'query_text')
    })

    it('should use value formatter for Badge format', () => {
      const result = formatCell(
        mockTable,
        mockData,
        mockRow,
        'status',
        'status',
        {},
        ColumnFormat.Badge
      )
      cy.mount(<TestWrapper>{result}</TestWrapper>)
      cy.get('span[class*="rounded-full"]').should('exist')
    })

    it('should use context formatter for Link format', () => {
      const rowWithData = {
        ...mockRow,
        original: { database: 'system' },
        getValue: (key: string) => (key === 'database' ? 'system' : undefined),
      } as Row<any>

      const result = formatCell(
        mockTable,
        [{ database: 'system' }],
        rowWithData,
        'View',
        'name',
        {},
        ColumnFormat.Link,
        { href: '/database/[database]' }
      )
      cy.mount(<TestWrapper>{result}</TestWrapper>)
      cy.get('a[href="/database/system"]').should('exist')
    })

    it('should use default formatter for unknown format', () => {
      const result = formatCell(
        mockTable,
        mockData,
        mockRow,
        'plain value',
        'column',
        {},
        ColumnFormat.None
      )
      cy.mount(<TestWrapper>{result}</TestWrapper>)
      cy.contains('plain value').should('exist')
    })
  })

  describe('Formatter Registry', () => {
    it('should export FORMATTER_REGISTRY with all categories', () => {
      import('./index').then((module) => {
        expect(module.FORMATTER_REGISTRY).to.have.property('inline')
        expect(module.FORMATTER_REGISTRY).to.have.property('value')
        expect(module.FORMATTER_REGISTRY).to.have.property('context')
        expect(module.FORMATTER_REGISTRY).to.have.property('advanced')
      })
    })

    it('should provide helper functions for formatter lookup', () => {
      import('./index').then((module) => {
        expect(module.getInlineFormatter).to.be.a('function')
        expect(module.getValueFormatter).to.be.a('function')
        expect(module.getContextFormatter).to.be.a('function')
        expect(module.getAdvancedFormatter).to.be.a('function')
        expect(module.hasInlineFormatter).to.be.a('function')
        expect(module.hasValueFormatter).to.be.a('function')
        expect(module.hasContextFormatter).to.be.a('function')
        expect(module.hasAdvancedFormatter).to.be.a('function')
      })
    })
  })

  describe('Edge Cases', () => {
    it('badgeFormatter should handle empty values', () => {
      cy.mount(<TestWrapper>{badgeFormatter('')}</TestWrapper>)
      cy.get('span[class*="rounded-full"]').should('exist')
    })

    it('booleanFormatter should handle various truthy values', () => {
      const truthyValues = ['yes', 'Y', '1', 't', true, 1]

      truthyValues.forEach((value) => {
        cy.mount(<TestWrapper>{booleanFormatter(value as any)}</TestWrapper>)
        cy.get('[aria-label="yes"]').should('exist')
      })
    })

    it('durationFormatter should handle NaN gracefully', () => {
      cy.mount(<TestWrapper>{durationFormatter('invalid' as any)}</TestWrapper>)
      cy.contains('invalid').should('exist')
    })

    it('coloredBadgeFormatter should return null for empty values', () => {
      const result = coloredBadgeFormatter('')
      expect(result).to.be.null
    })

    it('codeDialogFormatter should not show dialog for short code', () => {
      const shortCode = 'SELECT 1'
      cy.mount(<TestWrapper>{codeDialogFormatter(shortCode)}</TestWrapper>)

      cy.get('code').should('exist')
      cy.get('[role="dialog"]').should('not.exist')
    })
  })
})
