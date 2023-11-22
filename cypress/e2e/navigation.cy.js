describe('Navigation', () => {
  it('should navigate to the /tables page', () => {
    cy.visitAndValidate('/overview', 'a[href*="merges"]', '/merges', 'Merges')
  })
})
