import { renderTrendVariant } from './trend'
import { DatabaseIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { MetricCard } from '../index'

describe('renderTrendVariant', () => {
  const mockData = [
    { value: 100, trend: 15.5 },
    { value: 120, trend: -5.2 },
  ]

  it('renders value with positive trend', () => {
    cy.mount(
      <div className="p-4">
        {renderTrendVariant({
          value: 1234,
          trend: 15.5,
          trendLabel: 'vs last hour',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('1234').should('be.visible')
    cy.contains('15.5%').should('be.visible')
    cy.contains('vs last hour').should('be.visible')
    cy.get('[data-lucide="trending-up"]').should('be.visible')
    cy.get('[data-lucide="trending-down"]').should('not.exist')
  })

  it('renders value with negative trend', () => {
    cy.mount(
      <div className="p-4">
        {renderTrendVariant({
          value: 1234,
          trend: -8.3,
          trendLabel: 'vs last hour',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('1234').should('be.visible')
    cy.contains('8.3%').should('be.visible')
    cy.contains('vs last hour').should('be.visible')
    cy.get('[data-lucide="trending-down"]').should('be.visible')
    cy.get('[data-lucide="trending-up"]').should('not.exist')
  })

  it('renders value with zero trend (neutral)', () => {
    cy.mount(
      <div className="p-4">
        {renderTrendVariant({
          value: 1000,
          trend: 0,
          trendLabel: 'No change',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('1000').should('be.visible')
    cy.contains('No change').should('be.visible')
    cy.get('[data-lucide="trending-up"]').should('not.exist')
    cy.get('[data-lucide="trending-down"]').should('not.exist')
  })

  it('renders value with undefined trend (treated as neutral)', () => {
    cy.mount(
      <div className="p-4">
        {renderTrendVariant({
          value: 1000,
          trend: undefined,
          trendLabel: 'Unknown trend',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('1000').should('be.visible')
    cy.contains('Unknown trend').should('be.visible')
    cy.get('[data-lucide="trending-up"]').should('not.exist')
    cy.get('[data-lucide="trending-down"]').should('not.exist')
  })

  it('renders trend from function', () => {
    cy.mount(
      <div className="p-4">
        {renderTrendVariant({
          value: 500,
          trend: (data) => (data[0]?.trend as number) || 0,
          trendLabel: (data) => `Based on ${data.length} data points`,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('500').should('be.visible')
    cy.contains('15.5%').should('be.visible')
    cy.contains('Based on 2 data points').should('be.visible')
  })

  it('renders without trend label', () => {
    cy.mount(
      <div className="p-4">
        {renderTrendVariant({
          value: 999,
          trend: 5.5,
          trendLabel: undefined,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('999').should('be.visible')
    cy.contains('5.5%').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <div className="p-4">
        {renderTrendVariant({
          value: 888,
          trend: 10.2,
          trendLabel: 'vs last hour',
          data: mockData,
          compact: true,
        })}
      </div>
    )

    cy.contains('888').should('be.visible')
    cy.contains('10.2%').should('be.visible')
    cy.contains('vs last hour').should('be.visible')
  })

  it('applies correct color for positive trend', () => {
    cy.mount(
      <div className="p-4">
        {renderTrendVariant({
          value: 1234,
          trend: 15.5,
          trendLabel: 'up',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('15.5%')
      .should('have.class', 'text-emerald-600')
      .or('have.class', 'dark:text-emerald-400')
  })

  it('applies correct color for negative trend', () => {
    cy.mount(
      <div className="p-4">
        {renderTrendVariant({
          value: 1234,
          trend: -8.3,
          trendLabel: 'down',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('8.3%')
      .should('have.class', 'text-rose-600')
      .or('have.class', 'dark:text-rose-400')
  })
})

describe('<MetricCard variant="trend" />', () => {
  it('renders loading state', () => {
    cy.mount(
      <MetricCard
        swr={{ isLoading: true }}
        title="Query Rate"
        variant="trend"
        value={1234}
        trend={15.5}
        trendLabel="vs last hour"
      />
    )

    cy.contains('Loading').should('be.visible')
    cy.contains('Query Rate').should('be.visible')
  })

  it('renders error state', () => {
    cy.mount(
      <MetricCard
        swr={{ error: new Error('Connection failed') }}
        title="Query Rate"
        variant="trend"
        value={1234}
        trend={15.5}
        trendLabel="vs last hour"
      />
    )

    cy.contains('Error').should('be.visible')
    cy.contains('Query Rate').should('be.visible')
  })

  it('renders empty state', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [] }}
        title="Query Rate"
        variant="trend"
        value={1234}
        trend={15.5}
        trendLabel="vs last hour"
      />
    )

    cy.contains('-').should('be.visible')
    cy.contains('Query Rate').should('be.visible')
  })

  it('renders data display with positive trend', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Query Rate"
        variant="trend"
        value={1234}
        trend={15.5}
        trendLabel="vs last hour"
      />
    )

    cy.contains('1234').should('be.visible')
    cy.contains('15.5%').should('be.visible')
    cy.contains('vs last hour').should('be.visible')
    cy.get('[data-lucide="trending-up"]').should('be.visible')
  })

  it('renders data display with negative trend', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 800 }], isLoading: false }}
        title="Query Rate"
        variant="trend"
        value={800}
        trend={-12.3}
        trendLabel="vs last hour"
      />
    )

    cy.contains('800').should('be.visible')
    cy.contains('12.3%').should('be.visible')
    cy.contains('vs last hour').should('be.visible')
    cy.get('[data-lucide="trending-down"]').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 567 }], isLoading: false }}
        title="Query Rate"
        variant="trend"
        value={567}
        trend={5.2}
        trendLabel="vs last hour"
        compact
      />
    )

    cy.contains('567').should('be.visible')
    cy.contains('5.2%').should('be.visible')
  })

  it('renders with icon', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 999 }], isLoading: false }}
        title="Query Rate"
        variant="trend"
        value={999}
        trend={8.7}
        trendLabel="vs last hour"
        icon={<DatabaseIcon className="size-4" />}
      />
    )

    cy.get('[data-lucide="database"]').should('be.visible')
  })

  it('renders with theme', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1000 }], isLoading: false }}
        title="Query Rate"
        variant="trend"
        value={1000}
        trend={10.5}
        trendLabel="vs last hour"
        theme="orange"
      />
    )

    cy.contains('1000').should('be.visible')
    cy.contains('10.5%').should('be.visible')
  })

  it('extracts values from data with functions', () => {
    cy.mount(
      <MetricCard
        swr={{
          data: [
            { current: 1000, previous: 850 },
            { current: 1200, previous: 1000 },
          ],
          isLoading: false,
        }}
        title="Query Rate"
        variant="trend"
        value={(data) => data[data.length - 1].current as number}
        trend={(data) => {
          const current = data[data.length - 1].current as number
          const previous = data[data.length - 1].previous as number
          return ((current - previous) / previous) * 100
        }}
        trendLabel="vs previous period"
      />
    )

    cy.contains('1200').should('be.visible')
    cy.contains('20.0%').should('be.visible')
    cy.contains('vs previous period').should('be.visible')
  })

  it('renders with description', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Query Rate"
        description="Queries per second"
        variant="trend"
        value={1234}
        trend={15.5}
        trendLabel="vs last hour"
      />
    )

    cy.contains('Queries per second').should('be.visible')
  })

  it('renders with viewAllHref', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Query Rate"
        variant="trend"
        value={1234}
        trend={15.5}
        trendLabel="vs last hour"
        viewAllHref="/queries"
        viewAllLabel="View details"
      />
    )

    cy.contains('View details').should('be.visible')
    cy.get('a[href="/queries"]').should('be.visible')
  })
})
