describe('Navigation', () => {
  it('should navigate to the /overview page', () => {
    // Open the webpage
    cy.visit('/overview')

    // Should redirect to the /overview page
    cy.url().should('match', /overview/)
  })

  it('should navigate to the /merge page', () => {
    // Open the webpage
    cy.visit('/overview')

    // Hover on "Merge" tab and click on "merge" item below
    cy.get('div').contains('Merge').trigger('mouseover')
  })
})
