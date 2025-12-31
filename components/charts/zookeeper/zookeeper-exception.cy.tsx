import { ChartZookeeperException } from './zookeeper-exception'

describe('<ChartZookeeperException />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Zookeeper Exceptions',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartZookeeperException {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Zookeeper Exceptions').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartZookeeperException {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Zookeeper Exceptions').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartZookeeperException {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartZookeeperException hostId={1} title="Host 1 Zookeeper Exceptions" />)

    cy.contains('Host 1 Zookeeper Exceptions').should('exist')
  })
})
