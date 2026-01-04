import { StatusIndicator } from './status-indicator'

describe('StatusIndicator', () => {
  it('renders online state with green color', () => {
    cy.mount(
      <StatusIndicator
        className="bg-emerald-500"
        title={['Host: server1', 'Online: 2 days']}
      />
    )

    cy.get('[role="status"]')
      .should('have.attr', 'aria-label', 'Online')
      .find('span')
      .should('have.class', 'bg-emerald-500')
  })

  it('renders offline state with red color by default', () => {
    cy.mount(<StatusIndicator title={['The host is offline']} />)

    cy.get('[role="status"]')
      .should('have.attr', 'aria-label', 'Offline')
      .find('span')
      .should('have.class', 'bg-red-400')
  })

  it('renders loading state with pulse animation', () => {
    cy.mount(
      <StatusIndicator
        className="bg-gray-400 animate-pulse"
        title={['Loading...']}
      />
    )

    cy.get('[role="status"]')
      .should('have.attr', 'aria-label', 'Online')
      .find('span')
      .should('have.class', 'bg-gray-400')
      .and('have.class', 'animate-pulse')
  })

  it('displays tooltip on hover', () => {
    cy.mount(
      <StatusIndicator
        className="bg-sky-500"
        title={['Host: server1', 'Online: 2 days', 'Version: 24.3.1']}
      />
    )

    cy.get('[role="status"]').realHover()
    cy.contains('Host: server1').should('be.visible')
    cy.contains('Online: 2 days').should('be.visible')
    cy.contains('Version: 24.3.1').should('be.visible')
  })

  it('supports custom size prop', () => {
    cy.mount(
      <StatusIndicator
        className="bg-emerald-500"
        size="size-4"
        title={['Online']}
      />
    )

    cy.get('[role="status"]').should('have.class', 'size-4')
  })

  it('has proper accessibility attributes', () => {
    cy.mount(<StatusIndicator title={['Offline']} />)

    cy.get('[role="status"]')
      .should('have.attr', 'role', 'status')
      .and('have.attr', 'aria-label', 'Offline')
      .find('span')
      .should('have.attr', 'aria-hidden', 'true')
  })
})
