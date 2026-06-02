import { ChartQueryMemory } from './query-memory'

describe('<ChartQueryMemory />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Query Memory',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartQueryMemory {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Query Memory').should('exist')
  })

  it('renders area chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/query-memory*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2025-01-01',
            memory_usage: 1073741824,
            readable_memory_usage: '1.00 GiB',
          },
          {
            event_time: '2025-01-02',
            memory_usage: 2147483648,
            readable_memory_usage: '2.00 GiB',
          },
        ],
        metadata: { duration: 35, rows: 2 },
      },
    }).as('chartData')
    cy.mount(<ChartQueryMemory {...defaultProps} />)
    cy.wait('@chartData')
    cy.get('[data-testid="query-memory-chart"]').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartQueryMemory {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartQueryMemory hostId={1} title="Host 1 Query Memory" />)

    cy.contains('Host 1 Query Memory').should('exist')
  })
})
