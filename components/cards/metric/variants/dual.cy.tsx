import { renderDualVariant } from './dual'
import { DatabaseIcon } from 'lucide-react'
import { MetricCard } from '../index'

describe('renderDualVariant', () => {
  const mockData = [{ value1: 100, value2: 200 }, { value1: 150, value2: 250 }]

  it('renders two values with units', () => {
    cy.mount(
      <div className="p-4">
        {renderDualVariant({
          value1: 1234,
          unit1: 'reads',
          value2: 5678,
          unit2: 'writes',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('1234').should('be.visible')
    cy.contains('reads').should('be.visible')
    cy.contains('5678').should('be.visible')
    cy.contains('writes').should('be.visible')
  })

  it('renders values from functions', () => {
    cy.mount(
      <div className="p-4">
        {renderDualVariant({
          value1: (data) => data.length,
          unit1: 'items',
          value2: (data) => data.length * 2,
          unit2: 'total',
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('2').should('be.visible')
    cy.contains('4').should('be.visible')
  })

  it('renders without units', () => {
    cy.mount(
      <div className="p-4">
        {renderDualVariant({
          value1: 42,
          unit1: undefined,
          value2: 84,
          unit2: undefined,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('42').should('be.visible')
    cy.contains('84').should('be.visible')
  })

  it('renders with partial units', () => {
    cy.mount(
      <div className="p-4">
        {renderDualVariant({
          value1: 100,
          unit1: 'ms',
          value2: 200,
          unit2: undefined,
          data: mockData,
          compact: false,
        })}
      </div>
    )

    cy.contains('100').should('be.visible')
    cy.contains('ms').should('be.visible')
    cy.contains('200').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <div className="p-4">
        {renderDualVariant({
          value1: 9999,
          unit1: 'ms',
          value2: 8888,
          unit2: 'ops',
          data: mockData,
          compact: true,
        })}
      </div>
    )

    cy.contains('9999').should('be.visible')
    cy.contains('ms').should('be.visible')
    cy.contains('8888').should('be.visible')
    // In compact mode, units should be smaller
    cy.contains('ms').should('have.class', 'text-[10px]')
  })
})

describe('<MetricCard variant="dual" />', () => {
  it('renders loading state', () => {
    cy.mount(
      <MetricCard
        swr={{ isLoading: true }}
        title="I/O Operations"
        variant="dual"
        value1={1234}
        unit1="reads/s"
        value2={5678}
        unit2="writes/s"
      />
    )

    cy.contains('Loading').should('be.visible')
    cy.contains('I/O Operations').should('be.visible')
  })

  it('renders error state', () => {
    cy.mount(
      <MetricCard
        swr={{ error: new Error('Connection failed') }}
        title="I/O Operations"
        variant="dual"
        value1={1234}
        unit1="reads/s"
        value2={5678}
        unit2="writes/s"
      />
    )

    cy.contains('Error').should('be.visible')
    cy.contains('I/O Operations').should('be.visible')
  })

  it('renders empty state', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [] }}
        title="I/O Operations"
        variant="dual"
        value1={1234}
        unit1="reads/s"
        value2={5678}
        unit2="writes/s"
      />
    )

    cy.contains('-').should('be.visible')
    cy.contains('I/O Operations').should('be.visible')
  })

  it('renders data display', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ v1: 100, v2: 200 }], isLoading: false }}
        title="I/O Operations"
        variant="dual"
        value1={100}
        unit1="reads/s"
        value2={200}
        unit2="writes/s"
      />
    )

    cy.contains('100').should('be.visible')
    cy.contains('reads/s').should('be.visible')
    cy.contains('200').should('be.visible')
    cy.contains('writes/s').should('be.visible')
  })

  it('renders compact mode', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ v1: 50, v2: 75 }], isLoading: false }}
        title="I/O Operations"
        variant="dual"
        value1={50}
        unit1="reads"
        value2={75}
        unit2="writes"
        compact
      />
    )

    cy.contains('50').should('be.visible')
    cy.contains('75').should('be.visible')
  })

  it('renders with icon', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ v1: 999, v2: 888 }], isLoading: false }}
        title="I/O Operations"
        variant="dual"
        value1={999}
        unit1="reads/s"
        value2={888}
        unit2="writes/s"
        icon={<DatabaseIcon className="size-4" />}
      />
    )

    cy.get('[data-lucide="database"]').should('be.visible')
    cy.contains('999').should('be.visible')
    cy.contains('888').should('be.visible')
  })

  it('renders with theme', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ v1: 100, v2: 200 }], isLoading: false }}
        title="I/O Operations"
        variant="dual"
        value1={100}
        unit1="reads/s"
        value2={200}
        unit2="writes/s"
        theme="blue"
      />
    )

    cy.contains('100').should('be.visible')
    cy.contains('200').should('be.visible')
  })

  it('extracts values from data with functions', () => {
    cy.mount(
      <MetricCard
        swr={{
          data: [
            { reads: 50, writes: 75 },
            { reads: 60, writes: 85 },
          ],
          isLoading: false,
        }}
        title="I/O Operations"
        variant="dual"
        value1={(data) => data.reduce((sum, item) => sum + (item.reads as number), 0)}
        unit1="reads"
        value2={(data) => data.reduce((sum, item) => sum + (item.writes as number), 0)}
        unit2="writes"
      />
    )

    cy.contains('110').should('be.visible')
    cy.contains('160').should('be.visible')
  })

  it('renders with description', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ v1: 100, v2: 200 }], isLoading: false }}
        title="I/O Operations"
        description="Real-time metrics"
        variant="dual"
        value1={100}
        unit1="reads/s"
        value2={200}
        unit2="writes/s"
      />
    )

    cy.contains('Real-time metrics').should('be.visible')
    cy.contains('I/O Operations').should('be.visible')
  })

  it('renders with viewAllHref', () => {
    cy.mount(
      <MetricCard
        swr={{ data: [{ v1: 100, v2: 200 }], isLoading: false }}
        title="I/O Operations"
        variant="dual"
        value1={100}
        unit1="reads/s"
        value2={200}
        unit2="writes/s"
        viewAllHref="/io"
        viewAllLabel="View I/O"
      />
    )

    cy.contains('View I/O').should('be.visible')
    cy.get('a[href="/io"]').should('be.visible')
  })
})
