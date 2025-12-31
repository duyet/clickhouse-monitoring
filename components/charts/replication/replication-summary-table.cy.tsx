import { ChartReplicationSummaryTable } from './replication-summary-table'

describe('<ChartReplicationSummaryTable />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Replication Summary',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartReplicationSummaryTable {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Replication Summary').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/replication-summary-table*', {
      statusCode: 500,
      body: { error: { message: 'Database connection failed' } },
    }).as('chartError')

    cy.mount(<ChartReplicationSummaryTable {...defaultProps} />)

    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/replication-summary-table*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartReplicationSummaryTable {...defaultProps} />)

    cy.wait('@chartEmpty')
    cy.contains('No results').should('exist')
  })

  it('renders table with data', () => {
    cy.intercept('GET', '/api/v1/charts/replication-summary-table*', {
      statusCode: 200,
      body: {
        data: [
          {
            table: 'my_table',
            type: 'ReplicatedMergeTree',
            current_executing: 2,
            total: 5,
          },
        ],
        metadata: {
          duration: 45,
          rows: 1,
          sql: 'SELECT ... FROM system.replication_queue',
        },
      },
    }).as('chartData')

    cy.mount(<ChartReplicationSummaryTable {...defaultProps} />)

    cy.wait('@chartData')
    cy.contains('my_table').should('exist')
    cy.contains('ReplicatedMergeTree').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartReplicationSummaryTable {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/replication-summary-table?hostId=1*', {
      statusCode: 200,
      body: {
        data: [
          {
            table: 'another_table',
            type: 'ReplicatedMergeTree',
            current_executing: 1,
            total: 3,
          },
        ],
        metadata: { duration: 30, rows: 1 },
      },
    }).as('chartDataHost1')

    cy.mount(<ChartReplicationSummaryTable hostId={1} title="Host 1 Replication" />)

    cy.wait('@chartDataHost1')
    cy.contains('Host 1 Replication').should('exist')
  })
})
