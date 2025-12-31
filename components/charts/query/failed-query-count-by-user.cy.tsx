import { ChartFailedQueryCountByType } from './failed-query-count-by-user'

describe('<ChartFailedQueryCountByType />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Failed Queries by User',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartFailedQueryCountByType {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Failed Queries by User').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/failed-query-count-by-user*', {
      statusCode: 500,
      body: { error: { message: 'Database connection failed' } },
    }).as('chartError')

    cy.mount(<ChartFailedQueryCountByType {...defaultProps} />)

    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/failed-query-count-by-user*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartFailedQueryCountByType {...defaultProps} />)

    cy.wait('@chartEmpty')
    cy.contains('No results').should('exist')
  })

  it('renders chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/failed-query-count-by-user*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2024-01-01 00:00:00',
            user: 'default',
            count: 5,
          },
          {
            event_time: '2024-01-01 01:00:00',
            user: 'admin',
            count: 2,
          },
        ],
        metadata: {
          duration: 45,
          rows: 2,
          sql: 'SELECT ... FROM system.query_log',
        },
      },
    }).as('chartData')

    cy.mount(<ChartFailedQueryCountByType {...defaultProps} />)

    cy.wait('@chartData')
    cy.contains('Failed Queries by User').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartFailedQueryCountByType {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/failed-query-count-by-user?hostId=1*', {
      statusCode: 200,
      body: {
        data: [
          {
            event_time: '2024-01-01 00:00:00',
            user: 'user1',
            count: 1,
          },
        ],
        metadata: { duration: 30, rows: 1 },
      },
    }).as('chartDataHost1')

    cy.mount(<ChartFailedQueryCountByType hostId={1} title="Host 1 Failed Queries" />)

    cy.wait('@chartDataHost1')
    cy.contains('Host 1 Failed Queries').should('exist')
  })
})
