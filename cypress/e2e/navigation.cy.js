describe('Navigation', () => {
  it('should navigate to the /tables page', () => {
    cy.visitAndValidate('/overview', 'a[href*="merges"]', '/merges', 'Merges')
  })

  it('should navigate to the /settings page', () => {
    cy.visitAndValidate('/overview', 'a[href*="settings"]', '/settings', 'Settings')
  })
})
