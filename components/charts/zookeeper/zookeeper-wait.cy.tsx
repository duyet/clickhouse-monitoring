import { ChartZookeeperWait } from './zookeeper-wait'

describe('<ChartZookeeperWait />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'Zookeeper Wait',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartZookeeperWait {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('Zookeeper Wait').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartZookeeperWait {...defaultProps} />)

    // Component should render without throwing
    cy.contains('Zookeeper Wait').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(<ChartZookeeperWait {...defaultProps} className="custom-test-class" />)

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartZookeeperWait hostId={1} title="Host 1 Zookeeper Wait" />)

    cy.contains('Host 1 Zookeeper Wait').should('exist')
  })
})
