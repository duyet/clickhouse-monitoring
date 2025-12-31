import { renderPulseVariant } from './pulse'
import { DatabaseIcon } from 'lucide-react'
import { MetricCard } from '../index'

describe('renderPulseVariant', () => {
  const mockData = [
    { value: 100, trend: 15.5 },
    { value: 120, trend: -5.2 },
  ]

  it('renders value with positive trend and sparkline', () => {
    cy.mount(
      <div className="p-4">
        {renderPulseVariant({
          value: 1234,
          unit: 'queries',
          trend: 15.5,
          trendLabel: 'vs last hour',
          data: mockData,
          compact: false,
          history: [100, 120, 115, 130, 125, 140, 135],
          historyLabel: '24h',
          showSparkline: true,
        })}
      </div>
    )

    cy.contains('1234').should('be.visible')
    cy.contains('queries').should('be.visible')
    cy.contains('15.5%').should('be.visible')
    cy.contains('vs last hour').should('be.visible')
    cy.contains('24h').should('be.visible')
    cy.get('[data-lucide="trending-up"]').should('be.visible')
  })

  it('renders value with negative trend', () => {
    cy.mount(
      <div className="p-4">
        {renderPulseVariant({
          value: 800,
          unit: 'queries',
          trend: -8.3,
          trendLabel: 'vs last hour',
          data: mockData,
          compact: false,
          history: [140, 135, 130, 125, 120, 115, 110],
          historyLabel: '24h',
          showSparkline: true,
        })}
      </div>
    )

    cy.contains('800').should('be.visible')
    cy.contains('8.3%').should('be.visible')
    cy.contains('vs last hour').should('be.visible')
    cy.get('[data-lucide="trending-down"]').should('be.visible')
  })

  it('renders value with neutral trend', () => {
    cy.mount(
      <div className="p-4">
        {renderPulseVariant({
          value: 1000,
          unit: 'queries',
          trend: 0,
          trendLabel: 'No change',
          data: mockData,
          compact: false,
          history: [100, 100, 100, 100, 100],
          showSparkline: true,
        })}
      </div>
    )

    cy.contains('1000').should('be.visible')
    cy.contains('No change').should('be.visible')
    cy.get('[data-lucide="trending-up"]').should('not.exist')
    cy.get('[data-lucide="trending-down"]').should('not.exist')
  })

  it('renders without sparkline when showSparkline is false', () => {
    cy.mount(
      <div className="p-4">
        {renderPulseVariant({
          value: 999,
          unit: 'ms',
          trend: 5.5,
          trendLabel: 'up',
          data: mockData,
          compact: false,
          history: [100, 110, 105, 115, 120],
          showSparkline: false,
        })}
      </div>
    )

    cy.contains('999').should('be.visible')
    cy.contains('5.5%').should('be.visible')
    // Sparkline should not be rendered
    cy.get('svg').should('not.exist')
  })

  it('renders without sparkline when history is empty', () => {
    cy.mount(
      <div className="p-4">
        {renderPulseVariant({
          value: 888,
          unit: 'ops',
          trend: 10.2,
          trendLabel: 'up',
          data: mockData,
          compact: false,
          history: [],
          showSparkline: true,
        })}
      </div>
    )

    cy.contains('888').should('be.visible')
    cy.contains('10.2%').should('be.visible')
    // Sparkline should not be rendered with empty history
    cy.get('svg').should('not.exist')
  })

  it('renders without unit', () => {
    cy.mount(
      <div className="p-4">
        {renderPulseVariant({
          value: 1234,
          unit: undefined,
          trend: 15.5,
          trendLabel: 'up',
          data: mockData,
          compact: false,
          history: [100, 120, 115, 130],
          showSparkline: true,
        })}
      </div>
    )

    cy.contains('1234').should('be.visible')
    cy.contains('15.5%').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <div className="p-4">
        {renderPulseVariant({
          value: 567,
          unit: 'ms',
          trend: 5.2,
          trendLabel: 'vs last hour',
          data: mockData,
          compact: true,
          history: [50, 55, 52, 58, 56],
          showSparkline: true,
        })}
      </div>
    )

    cy.contains('567').should('be.visible')
    cy.contains('ms').should('be.visible')
    cy.contains('5.2%').should('be.visible')
  })

  it('extracts values from functions', () => {
    cy.mount(
      <div className="p-4">
        {renderPulseVariant({
          value: (data) => data.length * 100,
          unit: 'items',
          trend: (data) => (data[0]?.trend as number) || 0,
          trendLabel: (data) => `From ${data.length} points`,
          data: mockData,
          compact: false,
          history: [100, 120, 115],
          showSparkline: true,
        })}
      </div>
    )

    cy.contains('200').should('be.visible')
    cy.contains('15.5%').should('be.visible')
    cy.contains('From 2 points').should('be.visible')
  })

  it('applies correct color for positive trend', () => {
    cy.mount(
      <div className="p-4">
        {renderPulseVariant({
          value: 1234,
          unit: 'queries',
          trend: 15.5,
          trendLabel: 'up',
          data: mockData,
          compact: false,
          history: [100, 120, 130],
          showSparkline: true,
        })}
      </div>
    )

    // Positive trend uses emerald color
    cy.contains('15.5%')
      .parent()
      .should('have.class', 'text-emerald-600')
      .or('have.class', 'dark:text-emerald-400')
  })

  it('applies correct color for negative trend', () => {
    cy.mount(
      <div className="p-4">
        {renderPulseVariant({
          value: 800,
          unit: 'queries',
          trend: -8.3,
          trendLabel: 'down',
          data: mockData,
          compact: false,
          history: [140, 130, 120],
          showSparkline: true,
        })}
      </div>
    )

    // Negative trend uses rose color
    cy.contains('8.3%')
      .parent()
      .should('have.class', 'text-rose-600')
      .or('have.class', 'dark:text-rose-400')
  })
})

describe('<MetricCard variant="pulse" />', () => {
  it('renders loading state', () => {
    cy.mount(
      <MetricCard
        swr={{ isLoading: true }}
        title="Active Queries"
        variant="pulse"
        value={42}
        unit="queries"
        trend={5.2}
        trendLabel="vs last hour"
        history={[30, 35, 38, 40, 42]}
      />
    )

    cy.contains('Loading').should('be.visible')
    cy.contains('Active Queries').should('be.visible')
  })

  it('renders error state', () => {
    cy.mount(
      <MetricCard
        swr={{ error: new Error('Connection failed') }}
        title="Active Queries"
        variant="pulse"
        value={42}
        unit="queries"
        trend={5.2}
        trendLabel="vs last hour"
        history={[30, 35, 38, 40, 42]}
      />
    )

    cy.contains('Error').should('be.visible')
    cy.contains('Active Queries').should('be.visible')
  })

  it('renders empty state', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [] }}
        title="Active Queries"
        variant="pulse"
        value={42}
        unit="queries"
        trend={5.2}
        trendLabel="vs last hour"
        history={[30, 35, 38, 40, 42]}
      />
    )

    cy.contains('-').should('be.visible')
    cy.contains('Active Queries').should('be.visible')
  })

  it('renders data display with sparkline', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 42 }], isLoading: false }}
        title="Active Queries"
        variant="pulse"
        value={42}
        unit="queries"
        trend={5.2}
        trendLabel="vs last hour"
        history={[30, 35, 38, 40, 42]}
        showSparkline
      />
    )

    cy.contains('42').should('be.visible')
    cy.contains('queries').should('be.visible')
    cy.contains('5.2%').should('be.visible')
    cy.contains('vs last hour').should('be.visible')
    cy.get('svg').should('exist') // Sparkline SVG
  })

  it('renders without sparkline when showSparkline is false', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 42 }], isLoading: false }}
        title="Active Queries"
        variant="pulse"
        value={42}
        unit="queries"
        trend={5.2}
        trendLabel="vs last hour"
        history={[30, 35, 38, 40, 42]}
        showSparkline={false}
      />
    )

    cy.contains('42').should('be.visible')
    cy.get('svg').should('not.exist')
  })

  it('renders compact mode', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 15 }], isLoading: false }}
        title="Active Queries"
        variant="pulse"
        value={15}
        unit="queries"
        trend={-3.5}
        trendLabel="vs last hour"
        history={[20, 18, 17, 16, 15]}
        compact
      />
    )

    cy.contains('15').should('be.visible')
    cy.contains('3.5%').should('be.visible')
  })

  it('renders with icon', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 42 }], isLoading: false }}
        title="Active Queries"
        variant="pulse"
        value={42}
        unit="queries"
        trend={5.2}
        trendLabel="vs last hour"
        history={[30, 35, 38, 40, 42]}
        icon={<DatabaseIcon className="size-4" />}
      />
    )

    cy.get('[data-lucide="database"]').should('be.visible')
  })

  it('renders with theme', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 42 }], isLoading: false }}
        title="Active Queries"
        variant="pulse"
        value={42}
        unit="queries"
        trend={5.2}
        trendLabel="vs last hour"
        history={[30, 35, 38, 40, 42]}
        theme="cyan"
      />
    )

    cy.contains('42').should('be.visible')
  })

  it('extracts values from data with functions', () => {
    cy.mount(
      <MetricCard
        swr={{
          data: [
            { current: 42, history: [30, 35, 38, 40, 42], trend: 5.2 },
            { current: 45, history: [32, 37, 40, 42, 45], trend: 7.1 },
          ],
          isLoading: false,
        }}
        title="Active Queries"
        variant="pulse"
        value={(data) => data[data.length - 1].current as number}
        unit="queries"
        trend={(data) => data[data.length - 1].trend as number}
        trendLabel="vs last hour"
        history={(data) => data[data.length - 1].history as number[]}
      />
    )

    cy.contains('45').should('be.visible')
    cy.contains('7.1%').should('be.visible')
  })

  it('renders with description', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 42 }], isLoading: false }}
        title="Active Queries"
        description="Currently running"
        variant="pulse"
        value={42}
        unit="queries"
        trend={5.2}
        trendLabel="vs last hour"
        history={[30, 35, 38, 40, 42]}
      />
    )

    cy.contains('Currently running').should('be.visible')
  })

  it('renders with viewAllHref', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 42 }], isLoading: false }}
        title="Active Queries"
        variant="pulse"
        value={42}
        unit="queries"
        trend={5.2}
        trendLabel="vs last hour"
        history={[30, 35, 38, 40, 42]}
        viewAllHref="/queries"
        viewAllLabel="View queries"
      />
    )

    cy.contains('View queries').should('be.visible')
    cy.get('a[href="/queries"]').should('be.visible')
  })
})
