describe('Navigation', () => {
  it('should navigate to the /tables page', () => {
    cy.visitAndValidate('/overview', 'a[href*="merges"]', '/merges', 'Merges')
  })

  // it('should navigate to the /settings page', () => {
  //   cy.visit('/overviews')

  //   cy.get('nav ul li button').contains('Settings').hover()
  //   cy.get('a').contains('Settings').click()
  //   cy.url().should('include', '/settings')
  // })
})
