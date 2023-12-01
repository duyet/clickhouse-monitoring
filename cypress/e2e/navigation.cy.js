describe('Navigation', () => {
  it('should navigate to the /merge page', () => {
    cy.visit('/overview')

    cy.get('a[href*="merges"]').click()
    cy.url().should('include', '/merges')
    cy.contains('Merges', { matchCase: false }).should('be.visible')
  })
})
