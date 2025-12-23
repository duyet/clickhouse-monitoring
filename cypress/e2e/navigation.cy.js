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

    // Hover on "Merges" tab and click on "merges" item below
    cy.get('div').contains('Merges').trigger('mouseover')
  })
})
