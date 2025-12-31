import { ChartZookeeperRequests } from './zookeeper-requests'

describe('<ChartZookeeperRequests />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Zookeeper Requests',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartZookeeperRequests {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Zookeeper Requests').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartZookeeperRequests {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Zookeeper Requests').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartZookeeperRequests {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartZookeeperRequests hostId={1} title="Host 1 Zookeeper Requests" />)

    cy.contains('Host 1 Zookeeper Requests').should('exist')
  })
})
