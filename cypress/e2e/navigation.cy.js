describe('Navigation', () => {
  it('should navigate to the running queries page', () => {
    // Start from the index page
    cy.visit('http://localhost:3000/')

    // Find a link with an href attribute containing "running-queries" and click it
    cy.get('a[href*="running-queries"]').click()

    // The new url should include "/running-queries"
    cy.url().should('include', '/running-queries')

    // The new page should contain an h1
    cy.get('h1').contains('running queries', { matchCase: false })
  })

  it('should navigate to the settings page', () => {
    // Start from the index page
    cy.visit('http://localhost:3000/')

    // Find a link with an href attribute containing "settings" and click it
    cy.get('a[href*="settings"]').click()

    // The new url should include "/settings"
    cy.url().should('include', '/settings')

    // The new page should contain an h1
    cy.get('h1').contains('settings', { matchCase: false })

    // The page should contains a table
    cy.get('table').should('exist')
  })
})
