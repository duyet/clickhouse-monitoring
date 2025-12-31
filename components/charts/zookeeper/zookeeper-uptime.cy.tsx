import { ChartZookeeperUptime } from './zookeeper-uptime'

describe('<ChartZookeeperUptime />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Zookeeper Uptime',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartZookeeperUptime {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Zookeeper Uptime').should('exist')
  })

  it('renders error state when API fails', () => {
    cy.intercept('GET', '/api/v1/charts/zookeeper-uptime*', {
      statusCode: 500,
      body: { error: { message: 'Database connection failed' } },
    }).as('chartError')

    cy.mount(<ChartZookeeperUptime {...defaultProps} />)

    cy.wait('@chartError')
    cy.contains('Error').should('exist')
  })

  it('renders empty state when no data', () => {
    cy.intercept('GET', '/api/v1/charts/zookeeper-uptime*', {
      statusCode: 200,
      body: { data: [], metadata: {} },
    }).as('chartEmpty')

    cy.mount(<ChartZookeeperUptime {...defaultProps} />)

    cy.wait('@chartEmpty')
    cy.contains('No results').should('exist')
  })

  it('renders chart with uptime data', () => {
    cy.intercept('GET', '/api/v1/charts/zookeeper-uptime*', {
      statusCode: 200,
      body: {
        data: [{ uptime: '5 days, 3 hours, 20 minutes' }],
        metadata: {
          duration: 45,
          rows: 1,
          sql: 'SELECT uptime FROM system.zookeeper',
        },
      },
    }).as('chartData')

    cy.mount(<ChartZookeeperUptime {...defaultProps} />)

    cy.wait('@chartData')
    cy.contains('5 days, 3 hours, 20 minutes').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartZookeeperUptime {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.intercept('GET', '/api/v1/charts/zookeeper-uptime?hostId=1*', {
      statusCode: 200,
      body: {
        data: [{ uptime: '10 days, 5 hours' }],
        metadata: { duration: 30, rows: 1 },
      },
    }).as('chartDataHost1')

    cy.mount(<ChartZookeeperUptime hostId={1} title="Host 1 ZooKeeper Uptime" />)

    cy.wait('@chartDataHost1')
    cy.contains('Host 1 ZooKeeper Uptime').should('exist')
  })
})
