import { DatabaseIcon } from 'lucide-react'

import { MetricCard } from '../index'
import { renderSingleVariant } from './single'

describe('renderSingleVariant', () => {
  const mockData = [{ value: 1234 }, { value: 5678 }]

  it('renders single value with number', () => {
    cy.mount(
      <div className="p-4">
        {renderSingleVariant({
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

  it('renders single value with string', () => {
    cy.mount(
      <div className="p-4">
        {renderSingleVariant({
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

  it('renders value from function', () => {
    cy.mount(
      <div className="p-4">
        {renderSingleVariant({
          value: (data) => data.length,
          unit: 'items',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('2').should('be.visible')
    cy.contains('items').should('be.visible')
  })

  it('renders without unit', () => {
    cy.mount(
      <div className="p-4">
        {renderSingleVariant({
          value: 42,
          unit: undefined,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('42').should('be.visible')
  })

  it('renders compact mode with smaller text', () => {
    cy.mount(
      <div className="p-4">
        {renderSingleVariant({
          value: 9999,
          unit: 'ms',
          data: mockData,
          compact: true,
        })}
      </div>
    )

    cy.contains('9999').should('be.visible')
    cy.contains('ms').should('be.visible')
    // In compact mode, unit should be smaller
    cy.contains('ms').should('have.class', 'text-[10px]')
  })
})

describe('<MetricCard variant="single" />', () => {
  it('renders loading state', () => {
    cy.mount(
      <MetricCard
        swr={{ isLoading: true }}
        title="Total Queries"
        variant="single"
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
        variant="single"
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
        variant="single"
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
        variant="single"
        value={1234}
        unit="queries"
      />
    )

    cy.contains('1234').should('be.visible')
    cy.contains('queries').should('be.visible')
    cy.contains('Total Queries').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 5678 }], isLoading: false }}
        title="Total Queries"
        variant="single"
        value={5678}
        unit="queries"
        compact
      />
    )

    cy.contains('5678').should('be.visible')
    cy.contains('queries').should('be.visible')
  })

  it('renders with icon', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 999 }], isLoading: false }}
        title="Total Queries"
        variant="single"
        value={999}
        unit="queries"
        icon={<DatabaseIcon className="size-4" />}
      />
    )

    cy.get('[data-lucide="database"]').should('be.visible')
    cy.contains('999').should('be.visible')
  })

  it('renders with theme', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 100 }], isLoading: false }}
        title="Total Queries"
        variant="single"
        value={100}
        unit="queries"
        theme="purple"
      />
    )

    cy.contains('100').should('be.visible')
    cy.contains('queries').should('be.visible')
  })

  it('extracts value from data with function', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ count: 50 }, { count: 75 }], isLoading: false }}
        title="Total Items"
        variant="single"
        value={(data) =>
          data.reduce((sum, item) => sum + (item.count as number), 0)
        }
        unit="items"
      />
    )

    cy.contains('125').should('be.visible')
  })

  it('renders with description', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Total Queries"
        description="Last 24 hours"
        variant="single"
        value={1234}
        unit="queries"
      />
    )

    cy.contains('Last 24 hours').should('be.visible')
    cy.contains('Total Queries').should('be.visible')
  })

  it('renders with viewAllHref', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ value: 1234 }], isLoading: false }}
        title="Total Queries"
        variant="single"
        value={1234}
        unit="queries"
        viewAllHref="/queries"
        viewAllLabel="View queries"
      />
    )

    cy.contains('View queries').should('be.visible')
    cy.get('a[href="/queries"]').should('be.visible')
  })
})
