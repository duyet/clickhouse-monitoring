import { DatabaseIcon } from 'lucide-react'

import { MetricCard } from '../index'
import { renderSubtitleVariant } from './subtitle'

describe('renderSubtitleVariant', () => {
  const mockData = [
    { value: 100, info: 'active' },
    { value: 120, info: 'pending' },
  ]

  it('renders value with string subtitle', () => {
    cy.mount(
      <div className="p-4">
        {renderSubtitleVariant({
          value: 1234,
          subtitle: 'Last 24 hours',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('1234').should('be.visible')
    cy.contains('Last 24 hours').should('be.visible')
  })

  it('renders value with function subtitle', () => {
    cy.mount(
      <div className="p-4">
        {renderSubtitleVariant({
          value: 567,
          subtitle: (data) => `From ${data.length} sources`,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('567').should('be.visible')
    cy.contains('From 2 sources').should('be.visible')
  })

  it('renders without subtitle', () => {
    cy.mount(
      <div className="p-4">
        {renderSubtitleVariant({
          value: 999,
          subtitle: undefined,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('999').should('be.visible')
  })

  it('renders value from function', () => {
    cy.mount(
      <div className="p-4">
        {renderSubtitleVariant({
          value: (data) =>
            data.reduce((sum, item) => sum + (item.value as number), 0),
          subtitle: 'Total count',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('220').should('be.visible')
    cy.contains('Total count').should('be.visible')
  })

  it('renders string value', () => {
    cy.mount(
      <div className="p-4">
        {renderSubtitleVariant({
          value: '99.9%',
          subtitle: 'Uptime',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('99.9%').should('be.visible')
    cy.contains('Uptime').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <div className="p-4">
        {renderSubtitleVariant({
          value: 888,
          subtitle: 'Compact view',
          data: mockData,
          compact: true,
        })}
      </div>
    )

    cy.contains('888').should('be.visible')
    cy.contains('Compact view').should('be.visible')
    // In compact mode, subtitle should be smaller
    cy.contains('Compact view').should('have.class', 'text-[10px]')
  })

  it('renders both value and subtitle from functions', () => {
    cy.mount(
      <div className="p-4">
        {renderSubtitleVariant({
          value: (data) => data.length,
          subtitle: (data) => `${data.length} items total`,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('2').should('be.visible')
    cy.contains('2 items total').should('be.visible')
  })

  it('applies mono font to value', () => {
    cy.mount(
      <div className="p-4">
        {renderSubtitleVariant({
          value: 1234,
          subtitle: 'Total',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('1234').should('have.class', 'font-mono')
  })
})

describe('<MetricCard variant="subtitle" />', () => {
  it('renders loading state', () => {
    cy.mount(
      <MetricCard
        swr={{ isLoading: true }}
        title="Total Queries"
        variant="subtitle"
        value={1234}
        subtitle="Last 24 hours"
      />
    )

    cy.contains('Loading').should('be.visible')
    cy.contains('Total Queries').should('be.visible')
  })

  it('renders error state', () => {
    cy.mount(
      <MetricCard
        swr={{ error: new Error('Connection failed') }}
        title="Total Queries"
        variant="subtitle"
        value={1234}
        subtitle="Last 24 hours"
      />
    )

    cy.contains('Error').should('be.visible')
    cy.contains('Total Queries').should('be.visible')
  })

  it('renders empty state', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [] }}
        title="Total Queries"
        variant="subtitle"
        value={1234}
        subtitle="Last 24 hours"
      />
    )

    cy.contains('-').should('be.visible')
    cy.contains('Total Queries').should('be.visible')
  })

  it('renders data display', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Total Queries"
        variant="subtitle"
        value={1234}
        subtitle="Last 24 hours"
      />
    )

    cy.contains('1234').should('be.visible')
    cy.contains('Last 24 hours').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 567 }], isLoading: false }}
        title="Total Queries"
        variant="subtitle"
        value={567}
        subtitle="Last hour"
        compact
      />
    )

    cy.contains('567').should('be.visible')
    cy.contains('Last hour').should('be.visible')
  })

  it('renders with icon', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 999 }], isLoading: false }}
        title="Total Queries"
        variant="subtitle"
        value={999}
        subtitle="All time"
        icon={<DatabaseIcon className="size-4" />}
      />
    )

    cy.get('[data-lucide="database"]').should('be.visible')
  })

  it('renders with theme', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1000 }], isLoading: false }}
        title="Total Queries"
        variant="subtitle"
        value={1000}
        subtitle="Today"
        theme="pink"
      />
    )

    cy.contains('1000').should('be.visible')
    cy.contains('Today').should('be.visible')
  })

  it('extracts values from data with functions', () => {
    cy.mount(
      <MetricCard
        swr={{
          data: [
            { name: 'queries', count: 1000 },
            { name: 'mutations', count: 500 },
          ],
          isLoading: false,
        }}
        title="Total Operations"
        variant="subtitle"
        value={(data) =>
          data.reduce((sum, item) => sum + (item.count as number), 0)
        }
        subtitle={(data) => `${data.length} operation types`}
      />
    )

    cy.contains('1500').should('be.visible')
    cy.contains('2 operation types').should('be.visible')
  })

  it('renders with description', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Total Queries"
        description="Query performance"
        variant="subtitle"
        value={1234}
        subtitle="Last 24 hours"
      />
    )

    cy.contains('Query performance').should('be.visible')
  })

  it('renders with viewAllHref', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Total Queries"
        variant="subtitle"
        value={1234}
        subtitle="Last 24 hours"
        viewAllHref="/queries"
        viewAllLabel="View queries"
      />
    )

    cy.contains('View queries').should('be.visible')
    cy.get('a[href="/queries"]').should('be.visible')
  })

  it('renders without subtitle', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Total Queries"
        variant="subtitle"
        value={1234}
        subtitle={undefined}
      />
    )

    cy.contains('1234').should('be.visible')
    // Subtitle should not be rendered
    cy.get('.text-muted-foreground').should('not.exist')
  })

  it('renders with unit (though not typical for subtitle variant)', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Total Queries"
        variant="subtitle"
        value={1234}
        subtitle="per second"
      />
    )

    cy.contains('1234').should('be.visible')
    cy.contains('per second').should('be.visible')
  })
})
