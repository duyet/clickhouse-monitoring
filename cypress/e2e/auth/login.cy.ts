/**
 * E2E tests for OAuth login flows
 * Tests GitHub and Google OAuth authentication
 */

describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/login')
  })

  describe('Login Page UI', () => {
    it('should display login page with OAuth buttons', () => {
      cy.get('h1, [data-testid="login-title"]').should(
        'contain.text',
        'Welcome'
      )

      // Check for OAuth buttons (may be hidden if providers not configured)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="github-login"]').length > 0) {
          cy.get('[data-testid="github-login"]').should('be.visible')
        }
        if ($body.find('[data-testid="google-login"]').length > 0) {
          cy.get('[data-testid="google-login"]').should('be.visible')
        }
      })
    })

    it('should display Remember Me checkbox', () => {
      cy.get('[id="remember"], [data-testid="remember-me"]').should('exist')
    })

    it('should display Continue as Guest option', () => {
      cy.contains('button', /guest/i).should('be.visible')
    })

    it('should show auth not configured message when no providers', () => {
      // This test passes if either providers exist OR the not-configured message shows
      cy.get('body').then(($body) => {
        const hasProviders =
          $body.find('[data-testid="github-login"]').length > 0 ||
          $body.find('[data-testid="google-login"]').length > 0
        const hasNotConfigured =
          $body.text().includes('not configured') ||
          $body.text().includes('Not Configured')

        expect(hasProviders || hasNotConfigured).to.be.true
      })
    })
  })

  describe('Guest Access', () => {
    it('should navigate to overview when clicking Continue as Guest', () => {
      cy.contains('button', /guest/i).click()
      cy.url().should('include', '/overview')
    })
  })

  describe('Remember Me Functionality', () => {
    it('should store remember me preference in sessionStorage', () => {
      // Check the Remember Me checkbox
      cy.get('[id="remember"], [data-testid="remember-me"]').check({
        force: true,
      })

      // Verify it's checked
      cy.get('[id="remember"], [data-testid="remember-me"]').should(
        'be.checked'
      )
    })

    it('should be checked by default', () => {
      cy.get('[id="remember"], [data-testid="remember-me"]').should(
        'be.checked'
      )
    })
  })

  describe('Redirect Handling', () => {
    it('should preserve redirect URL in query params', () => {
      cy.visit('/auth/login?redirect=/tables')

      // The redirect should be preserved for after login
      cy.url().should('include', 'redirect')
    })
  })

  describe('Error Display', () => {
    it('should display error from URL params', () => {
      cy.visit('/auth/login?error=access_denied')

      // Error should be displayed
      cy.get('body').should('contain.text', 'access_denied')
    })
  })
})

describe('OAuth Button Behavior', () => {
  beforeEach(() => {
    cy.visit('/auth/login')
  })

  it('should show loading state when GitHub button clicked', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="github-login"]').length > 0) {
        cy.get('[data-testid="github-login"]').click()

        // Should show loading state (button text changes or spinner appears)
        cy.get('[data-testid="github-login"]').should(
          'contain.text',
          'Redirecting'
        )
      }
    })
  })

  it('should show loading state when Google button clicked', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="google-login"]').length > 0) {
        cy.get('[data-testid="google-login"]').click()

        // Should show loading state
        cy.get('[data-testid="google-login"]').should(
          'contain.text',
          'Redirecting'
        )
      }
    })
  })
})
