import { ActiveIndicator } from './active-indicator'

describe('<ActiveIndicator />', () => {
  it('renders bottom indicator', () => {
    cy.mount(<ActiveIndicator position="bottom" />)
    cy.get('.bg-primary').should('exist')
  })

  it('renders left indicator', () => {
    cy.mount(<ActiveIndicator position="left" />)
    cy.get('.bg-primary').should('exist')
  })

  it('shows active state', () => {
    cy.mount(<ActiveIndicator position="bottom" active={true} />)
    cy.get('.scale-x-100').should('exist')
  })

  it('shows inactive state', () => {
    cy.mount(<ActiveIndicator position="bottom" active={false} />)
    cy.get('.scale-x-0').should('exist')
  })
})
