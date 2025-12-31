import { ChartQueryCountByUser } from './query-count-by-user'

describe('<ChartQueryCountByUser />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Queries by User',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartQueryCountByUser {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Queries by User').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/query-count-by-user*', {
      statusCode: 500,
      body: { error: { message: 'Database connection failed' } },
    }).as('chartError')

    cy.mount(<ChartQueryCountByUser {...defaultProps} />)

    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/query-count-by-user*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartQueryCountByUser {...defaultProps} />)

    cy.wait('@chartEmpty')
    cy.contains('No results').should('exist')
  })

  it('renders chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/query-count-by-user*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2024-01-01 00:00:00',
            user: 'default',
            count: 100,
          },
          {
            event_time: '2024-01-01 01:00:00',
            user: 'admin',
            count: 50,
          },
        ],
        metadata: {
          duration: 45,
          rows: 2,
          sql: 'SELECT ... FROM system.query_log',
        },
      },
    }).as('chartData')

    cy.mount(<ChartQueryCountByUser {...defaultProps} />)

    cy.wait('@chartData')
    cy.contains('Queries by User').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartQueryCountByUser {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/query-count-by-user?hostId=1*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2024-01-01 00:00:00',
            user: 'user1',
            count: 25,
          },
        ],
        metadata: { duration: 30, rows: 1 },
      },
    }).as('chartDataHost1')

    cy.mount(<ChartQueryCountByUser hostId={1} title="Host 1 Queries" />)

    cy.wait('@chartDataHost1')
    cy.contains('Host 1 Queries').should('exist')
  })
})
