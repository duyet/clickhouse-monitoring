import { DatabaseIcon } from 'lucide-react'

import type { MetricListItem } from '../types'

import { MetricCard } from '../index'
import { renderListVariant } from './list'

describe('renderListVariant', () => {
  const mockData = [
    { name: 'Item 1', count: 10 },
    { name: 'Item 2', count: 20 },
  ]

  it('renders list items as array', () => {
    const items: MetricListItem[] = [
      { label: 'Total Queries', value: 1234, format: 'mono' },
      { label: 'Failed Queries', value: 5, format: 'mono' },
      { label: 'Success Rate', value: '99.5%', format: 'text' },
    ]

    cy.mount(
      <div className="p-4">
        {renderListVariant({
          items,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('Total Queries').should('be.visible')
    cy.contains('1234').should('be.visible')
    cy.contains('Failed Queries').should('be.visible')
    cy.contains('5').should('be.visible')
    cy.contains('Success Rate').should('be.visible')
    cy.contains('99.5%').should('be.visible')
  })

  it('renders list items from function', () => {
    cy.mount(
      <div className="p-4">
        {renderListVariant({
          items: (data) =>
            data.map((item) => ({
              label: item.name as string,
              value: item.count as number,
              format: 'mono' as const,
            })),
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('Item 1').should('be.visible')
    cy.contains('10').should('be.visible')
    cy.contains('Item 2').should('be.visible')
    cy.contains('20').should('be.visible')
  })

  it('renders mono format values', () => {
    const items: MetricListItem[] = [
      { label: 'Count', value: 12345, format: 'mono' },
    ]

    cy.mount(
      <div className="p-4">
        {renderListVariant({
          items,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('12345').should('have.class', 'font-mono')
  })

  it('renders truncate format values', () => {
    const items: MetricListItem[] = [
      {
        label: 'ID',
        value: 'very-long-id-string-that-should-be-truncated',
        format: 'truncate',
      },
    ]

    cy.mount(
      <div className="p-4">
        {renderListVariant({
          items,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('very-long-id-string-that-should-be-truncated').should(
      'have.attr',
      'title',
      'very-long-id-string-that-should-be-truncated'
    )
  })

  it('renders text format values', () => {
    const items: MetricListItem[] = [
      { label: 'Status', value: 'Active', format: 'text' },
    ]

    cy.mount(
      <div className="p-4">
        {renderListVariant({
          items,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('Active').should('be.visible')
    cy.contains('Active').should('not.have.class', 'font-mono')
  })

  it('renders compact mode', () => {
    const items: MetricListItem[] = [
      { label: 'Count', value: 100, format: 'mono' },
      { label: 'Rate', value: '99%', format: 'text' },
    ]

    cy.mount(
      <div className="p-4">
        {renderListVariant({
          items,
          data: mockData,
          compact: true,
        })}
      </div>
    )

    cy.contains('Count').should('be.visible')
    cy.contains('100').should('be.visible')
    // In compact mode, labels should be text-xs
    cy.contains('Count').should('have.class', 'text-xs')
  })

  it('handles default format (text)', () => {
    const items: MetricListItem[] = [
      { label: 'Value', value: 'test' }, // No format specified
    ]

    cy.mount(
      <div className="p-4">
        {renderListVariant({
          items,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('test').should('be.visible')
  })
})

describe('<MetricCard variant="list" />', () => {
  it('renders loading state', () => {
    cy.mount(
      <MetricCard
        swr={{ isLoading: true }}
        title="Query Statistics"
        variant="list"
        items={[
          { label: 'Total', value: 1000, format: 'mono' },
          { label: 'Failed', value: 5, format: 'mono' },
        ]}
      />
    )

    cy.contains('Loading').should('be.visible')
    cy.contains('Query Statistics').should('be.visible')
  })

  it('renders error state', () => {
    cy.mount(
      <MetricCard
        swr={{ error: new Error('Connection failed') }}
        title="Query Statistics"
        variant="list"
        items={[
          { label: 'Total', value: 1000, format: 'mono' },
          { label: 'Failed', value: 5, format: 'mono' },
        ]}
      />
    )

    cy.contains('Error').should('be.visible')
    cy.contains('Query Statistics').should('be.visible')
  })

  it('renders empty state', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [] }}
        title="Query Statistics"
        variant="list"
        items={[
          { label: 'Total', value: 1000, format: 'mono' },
          { label: 'Failed', value: 5, format: 'mono' },
        ]}
      />
    )

    cy.contains('-').should('be.visible')
    cy.contains('Query Statistics').should('be.visible')
  })

  it('renders data display', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ total: 1000, failed: 5 }], isLoading: false }}
        title="Query Statistics"
        variant="list"
        items={[
          { label: 'Total Queries', value: 1000, format: 'mono' },
          { label: 'Failed Queries', value: 5, format: 'mono' },
          { label: 'Success Rate', value: '99.5%', format: 'text' },
        ]}
      />
    )

    cy.contains('Total Queries').should('be.visible')
    cy.contains('1000').should('be.visible')
    cy.contains('Failed Queries').should('be.visible')
    cy.contains('5').should('be.visible')
    cy.contains('Success Rate').should('be.visible')
    cy.contains('99.5%').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ total: 500, failed: 2 }], isLoading: false }}
        title="Query Statistics"
        variant="list"
        items={[
          { label: 'Total', value: 500, format: 'mono' },
          { label: 'Failed', value: 2, format: 'mono' },
        ]}
        compact
      />
    )

    cy.contains('Total').should('be.visible')
    cy.contains('500').should('be.visible')
    cy.contains('Failed').should('be.visible')
    cy.contains('2').should('be.visible')
  })

  it('renders with icon', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ total: 1000, failed: 5 }], isLoading: false }}
        title="Query Statistics"
        variant="list"
        items={[
          { label: 'Total', value: 1000, format: 'mono' },
          { label: 'Failed', value: 5, format: 'mono' },
        ]}
        icon={<DatabaseIcon className="size-4" />}
      />
    )

    cy.get('[data-lucide="database"]').should('be.visible')
  })

  it('renders with theme', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ total: 1000, failed: 5 }], isLoading: false }}
        title="Query Statistics"
        variant="list"
        items={[
          { label: 'Total', value: 1000, format: 'mono' },
          { label: 'Failed', value: 5, format: 'mono' },
        ]}
        theme="green"
      />
    )

    cy.contains('Total').should('be.visible')
    cy.contains('1000').should('be.visible')
  })

  it('generates items from function', () => {
    cy.mount(
      <MetricCard
        swr={{
          data: [
            { name: 'queries', value: 1000 },
            { name: 'mutations', value: 500 },
          ],
          isLoading: false,
        }}
        title="Operations"
        variant="list"
        items={(data) =>
          data.map((item) => ({
            label: item.name as string,
            value: item.value as number,
            format: 'mono' as const,
          }))
        }
      />
    )

    cy.contains('queries').should('be.visible')
    cy.contains('1000').should('be.visible')
    cy.contains('mutations').should('be.visible')
    cy.contains('500').should('be.visible')
  })

  it('renders with description', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ total: 1000, failed: 5 }], isLoading: false }}
        title="Query Statistics"
        description="Last 24 hours"
        variant="list"
        items={[
          { label: 'Total', value: 1000, format: 'mono' },
          { label: 'Failed', value: 5, format: 'mono' },
        ]}
      />
    )

    cy.contains('Last 24 hours').should('be.visible')
  })

  it('renders with viewAllHref', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ total: 1000, failed: 5 }], isLoading: false }}
        title="Query Statistics"
        variant="list"
        items={[
          { label: 'Total', value: 1000, format: 'mono' },
          { label: 'Failed', value: 5, format: 'mono' },
        ]}
        viewAllHref="/queries"
        viewAllLabel="View all"
      />
    )

    cy.contains('View all').should('be.visible')
    cy.get('a[href="/queries"]').should('be.visible')
  })
})
