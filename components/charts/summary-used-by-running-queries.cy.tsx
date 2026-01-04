import { ChartSummaryUsedByRunningQueries } from './summary-used-by-running-queries'

describe('<ChartSummaryUsedByRunningQueries />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Summary - Running Queries',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartSummaryUsedByRunningQueries {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Summary - Running Queries').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-running-queries*', {
      statusCode: 500,
      body: { error: { message: 'Database connection failed' } },
    }).as('chartError')

    cy.mount(<ChartSummaryUsedByRunningQueries {...defaultProps} />)

    cy.wait('@chartError')

    cy.contains('Error').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-running-queries*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartSummaryUsedByRunningQueries {...defaultProps} />)

    cy.wait('@chartEmpty')

    cy.contains('No results').should('exist')
  })

  it('renders chart with data', () => {
    cy.intercept('GET', '/api/v1/charts/summary-used-by-running-queries*', {
      statusCode: 200,
      body: {
        data: [
          {
            main: [
              {
                query_count: 5,
                memory_usage: 1024000,
                readable_memory_usage: '1 MB',
              },
            ],
            totalMem: [
              { metric: 'memory', total: 17179869184, readable_total: '16 GB' },
            ],
            todayQueryCount: [{ query_count: 1250 }],
            rowsReadWritten: [
              {
                rows_read: 5000000,
                rows_written: 1000000,
                readable_rows_read: '5M',
                readable_rows_written: '1M',
              },
            ],
          },
        ],
        metadata: {
          duration: 45,
          rows: 1,
          sql: 'SELECT ... FROM system.processes',
        },
      },
    }).as('chartData')

    cy.mount(<ChartSummaryUsedByRunningQueries {...defaultProps} />)

    cy.wait('@chartData')

    cy.contains('queries').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartSummaryUsedByRunningQueries
        {...defaultProps}
        className="custom-test-class"
      />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept(
      'GET',
      '/api/v1/charts/summary-used-by-running-queries?hostId=1*',
      {
        statusCode: 200,
        body: {
          data: [
            {
              main: [
                {
                  query_count: 3,
                  memory_usage: 512000,
                  readable_memory_usage: '512 KB',
                },
              ],
              totalMem: [
                { metric: 'memory', total: 8589934592, readable_total: '8 GB' },
              ],
              todayQueryCount: [{ query_count: 800 }],
              rowsReadWritten: [
                {
                  rows_read: 3000000,
                  rows_written: 500000,
                  readable_rows_read: '3M',
                  readable_rows_written: '500K',
                },
              ],
            },
          ],
          metadata: { duration: 30, rows: 1 },
        },
      }
    ).as('chartDataHost1')

    cy.mount(
      <ChartSummaryUsedByRunningQueries hostId={1} title="Host 1 Summary" />
    )

    cy.wait('@chartDataHost1')

    cy.contains('Host 1 Summary').should('exist')
  })
})
