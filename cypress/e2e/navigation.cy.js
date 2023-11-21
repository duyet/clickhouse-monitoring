describe('Navigation', () => {
  it('should navigate to the running queries page', () => {
    cy.visitAndValidate('/overview', 'a[href*="running-queries"]', '/running-queries', 'Running Queries')
  })

  it('should navigate to the settings page', () => {
    cy.visitAndValidate('/overview', 'a[href*="settings"]', '/settings', 'Settings')
  })
})
