import { renderOversizedVariant } from './oversized'
import { DatabaseIcon } from 'lucide-react'
import { MetricCard } from '../index'

describe('renderOversizedVariant', () => {
  const mockData = [{ value: 100 }, { value: 200 }]

  it('renders large value with unit', () => {
    cy.mount(
      <div className="p-4">
        {renderOversizedVariant({
          value: 1234,
          unit: 'queries',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('1234').should('be.visible')
    cy.contains('queries').should('be.visible')
  })

  it('renders value from function', () => {
    cy.mount(
      <div className="p-4">
        {renderOversizedVariant({
          value: (data) =>
            data.reduce((sum, item) => sum + (item.value as number), 0),
          unit: 'total',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('300').should('be.visible')
    cy.contains('total').should('be.visible')
  })

  it('renders without unit', () => {
    cy.mount(
      <div className="p-4">
        {renderOversizedVariant({
          value: 42,
          unit: undefined,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('42').should('be.visible')
  })

  it('renders string value', () => {
    cy.mount(
      <div className="p-4">
        {renderOversizedVariant({
          value: '99.9%',
          unit: 'uptime',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('99.9%').should('be.visible')
    cy.contains('uptime').should('be.visible')
  })

  it('renders compact mode with smaller text', () => {
    cy.mount(
      <div className="p-4">
        {renderOversizedVariant({
          value: 999,
          unit: 'ms',
          data: mockData,
          compact: true,
        })}
      </div>
    )

    cy.contains('999').should('be.visible')
    cy.contains('ms').should('be.visible')
  })

  it('centers content horizontally', () => {
    cy.mount(
      <div className="p-4">
        {renderOversizedVariant({
          value: 567,
          unit: 'ops',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    // Should have justify-center class
    cy.contains('567').parent().should('have.class', 'justify-center')
  })

  it('applies muted foreground color', () => {
    cy.mount(
      <div className="p-4">
        {renderOversizedVariant({
          value: 888,
          unit: 'items',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    // Value should have foreground/50 (or /40 in dark mode)
    cy.contains('888')
      .should('have.class', 'text-foreground/50')
      .or('have.class', 'dark:text-foreground/40')
  })

  it('applies font-black for bold text', () => {
    cy.mount(
      <div className="p-4">
        {renderOversizedVariant({
          value: 1234,
          unit: 'queries',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('1234').should('have.class', 'font-black')
  })

  it('applies mono font for tabular numbers', () => {
    cy.mount(
      <div className="p-4">
        {renderOversizedVariant({
          value: 1234,
          unit: 'queries',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('1234').should('have.class', 'font-mono')
  })

  it('uses very large font sizes in non-compact mode', () => {
    cy.mount(
      <div className="p-4">
        {renderOversizedVariant({
          value: 1234,
          unit: 'queries',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    // Should have large responsive text classes
    cy.contains('1234').should('have.class', 'text-5xl')
  })
})

describe('<MetricCard variant="oversized" />', () => {
  it('renders loading state', () => {
    cy.mount(
      <MetricCard
        swr={{ isLoading: true }}
        title="Total Queries"
        variant="oversized"
        value={1234}
        unit="queries"
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
        variant="oversized"
        value={1234}
        unit="queries"
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
        variant="oversized"
        value={1234}
        unit="queries"
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
        variant="oversized"
        value={1234}
        unit="queries"
      />
    )

    cy.contains('1234').should('be.visible')
    cy.contains('queries').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 567 }], isLoading: false }}
        title="Total Queries"
        variant="oversized"
        value={567}
        unit="queries"
        compact
      />
    )

    cy.contains('567').should('be.visible')
    cy.contains('queries').should('be.visible')
  })

  it('renders with icon', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 999 }], isLoading: false }}
        title="Total Queries"
        variant="oversized"
        value={999}
        unit="queries"
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
        variant="oversized"
        value={1000}
        unit="queries"
        theme="cyan"
      />
    )

    cy.contains('1000').should('be.visible')
  })

  it('extracts values from data with functions', () => {
    cy.mount(
      <MetricCard
        swr={{
          data: [{ count: 1000 }, { count: 500 }],
          isLoading: false,
        }}
        title="Total Operations"
        variant="oversized"
        value={(data) =>
          data.reduce((sum, item) => sum + (item.count as number), 0)
        }
        unit="operations"
      />
    )

    cy.contains('1500').should('be.visible')
    cy.contains('operations').should('be.visible')
  })

  it('renders with description', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Total Queries"
        description="All time"
        variant="oversized"
        value={1234}
        unit="queries"
      />
    )

    cy.contains('All time').should('be.visible')
  })

  it('renders with viewAllHref', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Total Queries"
        variant="oversized"
        value={1234}
        unit="queries"
        viewAllHref="/queries"
        viewAllLabel="View all"
      />
    )

    cy.contains('View all').should('be.visible')
    cy.get('a[href="/queries"]').should('be.visible')
  })

  it('renders without unit', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 42 }], isLoading: false }}
        title="Answer"
        variant="oversized"
        value={42}
      />
    )

    cy.contains('42').should('be.visible')
  })

  it('renders with percentage string value', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 99.9 }], isLoading: false }}
        title="Success Rate"
        variant="oversized"
        value="99.9%"
      />
    )

    cy.contains('99.9%').should('be.visible')
  })
})
