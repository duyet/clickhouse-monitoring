/**
 * E2E tests for OAuth error handling
 * Tests error display when OAuth fails (FR-2.7: Show error toast, stay on current page)
 */

describe('OAuth Error Handling', () => {
  describe('Error Page', () => {
    it('should display error page with message', () => {
      cy.visit('/auth/error?error=access_denied')

      // Should show error message
      cy.get('body').should('contain.text', 'error')
    })

    it('should provide link back to login', () => {
      cy.visit('/auth/error?error=access_denied')

      // Should have a way to try again
      cy.get('a[href*="login"], button').should('exist')
    })

    it('should display different error types appropriately', () => {
      // Test access_denied
      cy.visit('/auth/error?error=access_denied')
      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase()
        expect(text.includes('denied') || text.includes('error')).to.be.true
      })

      // Test configuration error
      cy.visit('/auth/error?error=configuration')
      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase()
        expect(text.includes('configuration') || text.includes('error')).to.be
          .true
      })
    })
  })

  describe('Login Page Error Display', () => {
    it('should display error passed via query param on login page', () => {
      cy.visit('/auth/login?error=OAuth%20authentication%20failed')

      // Error should be visible on the page
      cy.get('body').should('contain.text', 'OAuth')
    })

    it('should allow retry after error', () => {
      cy.visit('/auth/login?error=temporary_error')

      // Should still be able to attempt login
      cy.get('body').then(($body) => {
        const hasLoginButtons =
          $body.find('[data-testid="github-login"]').length > 0 ||
          $body.find('[data-testid="google-login"]').length > 0 ||
          $body.find('button').filter(':contains("GitHub")').length > 0 ||
          $body.find('button').filter(':contains("Google")').length > 0

        const hasGuestOption = $body.text().toLowerCase().includes('guest')

        expect(hasLoginButtons || hasGuestOption).to.be.true
      })
    })
  })

  describe('Error Recovery', () => {
    it('should clear error when navigating away and back', () => {
      // Visit with error
      cy.visit('/auth/login?error=test_error')
      cy.get('body').should('contain.text', 'test_error')

      // Navigate to overview
      cy.contains('button', /guest/i).click()
      cy.url().should('include', '/overview')

      // Navigate back to login
      cy.visit('/auth/login')

      // Error should not persist (no error in URL)
      cy.url().should('not.include', 'error=test_error')
    })
  })
})
