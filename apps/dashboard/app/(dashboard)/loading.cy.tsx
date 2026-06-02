import Loading from './loading'

describe('<Loading />', () => {
  it('should render loading', () => {
    cy.mount(<Loading />)
    cy.get('[role="status"][aria-label="Loading page content"]')
      .should('be.visible')
      .and('have.attr', 'aria-busy', 'true')
  })
})
