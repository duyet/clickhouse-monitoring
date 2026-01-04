import { DatabaseIcon } from 'lucide-react'

import { MetricCard } from '../index'
import { renderSplitVariant } from './split'

describe('renderSplitVariant', () => {
  const mockData = [
    { value1: 100, value2: 200 },
    { value1: 150, value2: 250 },
  ]

  it('renders two values with labels', () => {
    cy.mount(
      <div className="p-4">
        {renderSplitVariant({
          value1: 42,
          label1: 'DATABASES',
          value2: 150,
          label2: 'TABLES',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('42').should('be.visible')
    cy.contains('DATABASES').should('be.visible')
    cy.contains('150').should('be.visible')
    cy.contains('TABLES').should('be.visible')
  })

  it('renders values from functions', () => {
    cy.mount(
      <div className="p-4">
        {renderSplitVariant({
          value1: (data) => data.length * 10,
          label1: 'ITEMS',
          value2: (data) => data.length * 20,
          label2: 'TOTAL',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('20').should('be.visible')
    cy.contains('ITEMS').should('be.visible')
    cy.contains('40').should('be.visible')
    cy.contains('TOTAL').should('be.visible')
  })

  it('renders without labels', () => {
    cy.mount(
      <div className="p-4">
        {renderSplitVariant({
          value1: 99,
          label1: undefined,
          value2: 88,
          label2: undefined,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('99').should('be.visible')
    cy.contains('88').should('be.visible')
  })

  it('renders with partial labels', () => {
    cy.mount(
      <div className="p-4">
        {renderSplitVariant({
          value1: 100,
          label1: 'FIRST',
          value2: 200,
          label2: undefined,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('100').should('be.visible')
    cy.contains('FIRST').should('be.visible')
    cy.contains('200').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <div className="p-4">
        {renderSplitVariant({
          value1: 123,
          label1: 'DB',
          value2: 456,
          label2: 'TABLES',
          data: mockData,
          compact: true,
        })}
      </div>
    )

    cy.contains('123').should('be.visible')
    cy.contains('DB').should('be.visible')
    cy.contains('456').should('be.visible')
    cy.contains('TABLES').should('be.visible')
  })

  it('renders with string values', () => {
    cy.mount(
      <div className="p-4">
        {renderSplitVariant({
          value1: '99.9%',
          label1: 'UPTIME',
          value2: '24',
          label2: 'HOURS',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('99.9%').should('be.visible')
    cy.contains('UPTIME').should('be.visible')
    cy.contains('24').should('be.visible')
    cy.contains('HOURS').should('be.visible')
  })

  it('applies muted text color for values', () => {
    cy.mount(
      <div className="p-4">
        {renderSplitVariant({
          value1: 42,
          label1: 'DB',
          value2: 150,
          label2: 'TABLES',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    // Values should have foreground/70 (or /60 in dark mode)
    cy.contains('42')
      .should('have.class', 'text-foreground/70')
      .or('have.class', 'dark:text-foreground/60')
    cy.contains('150')
      .should('have.class', 'text-foreground/70')
      .or('have.class', 'dark:text-foreground/60')
  })

  it('applies foreground/40 for labels', () => {
    cy.mount(
      <div className="p-4">
        {renderSplitVariant({
          value1: 42,
          label1: 'DB',
          value2: 150,
          label2: 'TABLES',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    // Labels should have foreground/40
    cy.contains('DB').should('have.class', 'text-foreground/40')
    cy.contains('TABLES').should('have.class', 'text-foreground/40')
  })

  it('renders with vertical divider', () => {
    cy.mount(
      <div className="p-4">
        {renderSplitVariant({
          value1: 42,
          label1: 'DB',
          value2: 150,
          label2: 'TABLES',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    // Check for vertical divider (h-px w-px)
    cy.get('.h-px.w-px').should('exist')
  })
})

describe('<MetricCard variant="split" />', () => {
  it('renders loading state', () => {
    cy.mount(
      <MetricCard
        swr={{ isLoading: true }}
        title="System Overview"
        variant="split"
        value1={42}
        label1="DATABASES"
        value2={150}
        label2="TABLES"
      />
    )

    cy.contains('Loading').should('be.visible')
    cy.contains('System Overview').should('be.visible')
  })

  it('renders error state', () => {
    cy.mount(
      <MetricCard
        swr={{ error: new Error('Connection failed') }}
        title="System Overview"
        variant="split"
        value1={42}
        label1="DATABASES"
        value2={150}
        label2="TABLES"
      />
    )

    cy.contains('Error').should('be.visible')
    cy.contains('System Overview').should('be.visible')
  })

  it('renders empty state', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [] }}
        title="System Overview"
        variant="split"
        value1={42}
        label1="DATABASES"
        value2={150}
        label2="TABLES"
      />
    )

    cy.contains('-').should('be.visible')
    cy.contains('System Overview').should('be.visible')
  })

  it('renders data display', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ databases: 42, tables: 150 }], isLoading: false }}
        title="System Overview"
        variant="split"
        value1={42}
        label1="DATABASES"
        value2={150}
        label2="TABLES"
      />
    )

    cy.contains('42').should('be.visible')
    cy.contains('DATABASES').should('be.visible')
    cy.contains('150').should('be.visible')
    cy.contains('TABLES').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ databases: 12, tables: 85 }], isLoading: false }}
        title="System Overview"
        variant="split"
        value1={12}
        label1="DB"
        value2={85}
        label2="TABLES"
        compact
      />
    )

    cy.contains('12').should('be.visible')
    cy.contains('DB').should('be.visible')
    cy.contains('85').should('be.visible')
    cy.contains('TABLES').should('be.visible')
  })

  it('renders with icon', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ databases: 42, tables: 150 }], isLoading: false }}
        title="System Overview"
        variant="split"
        value1={42}
        label1="DATABASES"
        value2={150}
        label2="TABLES"
        icon={<DatabaseIcon className="size-4" />}
      />
    )

    cy.get('[data-lucide="database"]').should('be.visible')
  })

  it('renders with theme', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ databases: 42, tables: 150 }], isLoading: false }}
        title="System Overview"
        variant="split"
        value1={42}
        label1="DATABASES"
        value2={150}
        label2="TABLES"
        theme="indigo"
      />
    )

    cy.contains('42').should('be.visible')
    cy.contains('150').should('be.visible')
  })

  it('extracts values from data with functions', () => {
    cy.mount(
      <MetricCard
        swr={{
          data: [
            { dbCount: 42, tableCount: 150 },
            { dbCount: 43, tableCount: 155 },
          ],
          isLoading: false,
        }}
        title="System Overview"
        variant="split"
        value1={(data) => data[data.length - 1].dbCount as number}
        label1="DATABASES"
        value2={(data) => data[data.length - 1].tableCount as number}
        label2="TABLES"
      />
    )

    cy.contains('43').should('be.visible')
    cy.contains('155').should('be.visible')
  })

  it('renders with description', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ databases: 42, tables: 150 }], isLoading: false }}
        title="System Overview"
        description="Total counts"
        variant="split"
        value1={42}
        label1="DATABASES"
        value2={150}
        label2="TABLES"
      />
    )

    cy.contains('Total counts').should('be.visible')
  })

  it('renders with viewAllHref', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ databases: 42, tables: 150 }], isLoading: false }}
        title="System Overview"
        variant="split"
        value1={42}
        label1="DATABASES"
        value2={150}
        label2="TABLES"
        viewAllHref="/databases"
        viewAllLabel="Explore"
      />
    )

    cy.contains('Explore').should('be.visible')
    cy.get('a[href="/databases"]').should('be.visible')
  })

  it('renders without labels', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ v1: 42, v2: 150 }], isLoading: false }}
        title="Quick Stats"
        variant="split"
        value1={42}
        label1={undefined}
        value2={150}
        label2={undefined}
      />
    )

    cy.contains('42').should('be.visible')
    cy.contains('150').should('be.visible')
  })
})
