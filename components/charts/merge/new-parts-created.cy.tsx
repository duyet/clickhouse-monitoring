import { ChartNewPartsCreated } from './new-parts-created'

describe('<ChartNewPartsCreated />', () => {
  const defaultProps = { hostId: 0, title: 'New Parts Created' }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartNewPartsCreated {...defaultProps} />)
    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/new-parts-created*', {
      statusCode: 500,
      body: { error: { message: 'Failed to fetch parts data' } },
    }).as('chartError')
    cy.mount(<ChartNewPartsCreated {...defaultProps} />)
    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders chart with data - single table', () => {
    cy.intercept('GET', '/api/v1/charts/new-parts-created*', {
      statusCode: 200,
      body: {
        data: [
          { event_time: '2025-01-01 00:00:00', table: 'my_table', new_parts: 15 },
          { event_time: '2025-01-01 00:15:00', table: 'my_table', new_parts: 22 },
        ],
        metadata: { duration: 52, rows: 2 },
      },
    }).as('chartData')
    cy.mount(<ChartNewPartsCreated {...defaultProps} />)
    cy.wait('@chartData')
    cy.get('[data-testid="new-parts-created-chart"]').should('exist')
  })

  it('renders chart with data - multiple tables', () => {
    cy.intercept('GET', '/api/v1/charts/new-parts-created*', {
      statusCode: 200,
      body: {
        data: [
          { event_time: '2025-01-01 00:00:00', table: 'table_a', new_parts: 10 },
          { event_time: '2025-01-01 00:00:00', table: 'table_b', new_parts: 8 },
          { event_time: '2025-01-01 00:15:00', table: 'table_a', new_parts: 12 },
          { event_time: '2025-01-01 00:15:00', table: 'table_b', new_parts: 15 },
        ],
        metadata: { duration: 45, rows: 4 },
      },
    }).as('chartData')
    cy.mount(<ChartNewPartsCreated {...defaultProps} />)
    cy.wait('@chartData')
    cy.get('[data-testid="new-parts-created-chart"]').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/new-parts-created?hostId=1*', {
      statusCode: 200,
      body: { data: [{ event_time: '2025-01-01', table: 'remote_table', new_parts: 5 }], metadata: { duration: 28, rows: 1 } },
    }).as('chartData')
    cy.mount(<ChartNewPartsCreated hostId={1} />)
    cy.wait('@chartData')
    cy.get('[data-testid="new-parts-created-chart"]').should('exist')
  })
})
