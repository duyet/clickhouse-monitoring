describe('Navigation', () => {
  it('should open /0/overview page', () => {
    // Open the webpage
    cy.visit('/0/overview')

    // Should redirect to the /0/overview page
    cy.url().should('match', /0\/overview/)
  })

  it('should able to hover to menu items', () => {
    // Open the webpage
    cy.visit('/0/overview')

    // Hover on "Merge" tab and click on "merge" item below
    cy.get('div').contains('Merge').trigger('mouseover')
  })
})
