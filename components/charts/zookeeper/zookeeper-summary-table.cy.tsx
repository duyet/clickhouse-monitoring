import { ChartZookeeperSummaryTable } from './zookeeper-summary-table'

describe('<ChartZookeeperSummaryTable />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'ZooKeeper Metrics',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartZookeeperSummaryTable {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('ZooKeeper Metrics').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/zookeeper-summary-table*', {
      statusCode: 500,
      body: { error: { message: 'Database connection failed' } },
    }).as('chartError')

    cy.mount(<ChartZookeeperSummaryTable {...defaultProps} />)

    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/zookeeper-summary-table*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartZookeeperSummaryTable {...defaultProps} />)

    cy.wait('@chartEmpty')
    cy.contains('No results').should('exist')
  })

  it('renders table with data', () => {
    cy.intercept('GET', '/api/v1/charts/zookeeper-summary-table*', {
      statusCode: 200,
      body: {
        data: [
          {
            metric: 'avg_latency',
            value: '5ms',
            desc: 'Average latency',
          },
          {
            metric: 'packet_count',
            value: '1000',
            desc: 'Total packets',
          },
        ],
        metadata: {
          duration: 45,
          rows: 2,
          sql: 'SELECT ... FROM system.zookeeper',
        },
      },
    }).as('chartData')

    cy.mount(<ChartZookeeperSummaryTable {...defaultProps} />)

    cy.wait('@chartData')
    cy.contains('avg_latency').should('exist')
    cy.contains('5ms').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartZookeeperSummaryTable
        {...defaultProps}
        className="custom-test-class"
      />
    )

    cy.get('.custom-test-class').should('exist')
  })
})
