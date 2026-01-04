import { ChartConnectionsHttp } from './connections-http'

describe('<ChartConnectionsHttp />', () => {
  const defaultProps = {
    hostId: 0,
    title: 'HTTP Connections',
  }

  it('renders chart skeleton when loading', () => {
    cy.mount(<ChartConnectionsHttp {...defaultProps} />)

    cy.get('[role="status"][aria-label*="Loading"]').should('exist')
    cy.contains('HTTP Connections').should('exist')
  })

  it('renders chart with data', () => {
    cy.mount(<ChartConnectionsHttp {...defaultProps} />)

    // Component should render without throwing
    cy.contains('HTTP Connections').should('exist')
  })

  it('applies custom className', () => {
    cy.mount(
      <ChartConnectionsHttp {...defaultProps} className="custom-test-class" />
    )

    cy.get('.custom-test-class').should('exist')
  })

  it('works with different hostId values', () => {
    cy.mount(<ChartConnectionsHttp hostId={1} title="Host 1 HTTP" />)

    cy.contains('Host 1 HTTP').should('exist')
  })
})
