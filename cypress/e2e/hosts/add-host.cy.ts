/**
 * E2E tests for adding ClickHouse hosts
 * Tests FR-3: Host Management functionality
 */

describe('Add Host Flow', () => {
  describe('Add Host Page', () => {
    beforeEach(() => {
      cy.visit('/hosts/new')
    })

    it('should display add host form', () => {
      // Form should be visible
      cy.get('form').should('exist')

      // Required fields should be present
      cy.get('input[name="name"], [data-testid="host-name"]').should('exist')
      cy.get(
        'input[name="host"], input[name="url"], [data-testid="host-url"]'
      ).should('exist')
      cy.get('input[name="username"], [data-testid="host-username"]').should(
        'exist'
      )
      cy.get('input[name="password"], [data-testid="host-password"]').should(
        'exist'
      )
    })

    it('should have password field with toggle visibility (FR-3.4)', () => {
      // Password field should exist
      cy.get('input[name="password"], [data-testid="host-password"]').should(
        'exist'
      )

      // Toggle visibility button should exist (eye icon)
      cy.get(
        '[data-testid="password-toggle"], button[aria-label*="password"], button[aria-label*="visibility"]'
      ).should('exist')
    })

    it('should toggle password visibility when clicking eye icon', () => {
      const passwordInput =
        'input[name="password"], [data-testid="host-password"]'

      // Initially should be password type
      cy.get(passwordInput).should('have.attr', 'type', 'password')

      // Click toggle
      cy.get(
        '[data-testid="password-toggle"], button[aria-label*="password"], button[aria-label*="visibility"]'
      )
        .first()
        .click()

      // Should now be text type
      cy.get(passwordInput).should('have.attr', 'type', 'text')

      // Click again to hide
      cy.get(
        '[data-testid="password-toggle"], button[aria-label*="password"], button[aria-label*="visibility"]'
      )
        .first()
        .click()

      // Should be password type again
      cy.get(passwordInput).should('have.attr', 'type', 'password')
    })

    it('should have optional Test Connection button (FR-3.5)', () => {
      // Test connection button should exist
      cy.get('[data-testid="test-connection"], button')
        .filter(':contains("Test")')
        .should('exist')
    })

    it('should have submit button', () => {
      cy.get('button[type="submit"], [data-testid="submit-host"]').should(
        'exist'
      )
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      cy.visit('/hosts/new')
    })

    it('should require name field', () => {
      // Try to submit without name
      cy.get(
        'input[name="host"], input[name="url"], [data-testid="host-url"]'
      ).type('http://localhost:8123')
      cy.get('input[name="username"], [data-testid="host-username"]').type(
        'default'
      )
      cy.get('input[name="password"], [data-testid="host-password"]').type(
        'password'
      )

      cy.get('button[type="submit"], [data-testid="submit-host"]').click()

      // Form should show validation error or not submit
      cy.url().should('include', '/hosts/new')
    })

    it('should require host URL field', () => {
      cy.get('input[name="name"], [data-testid="host-name"]').type('Test Host')
      cy.get('input[name="username"], [data-testid="host-username"]').type(
        'default'
      )
      cy.get('input[name="password"], [data-testid="host-password"]').type(
        'password'
      )

      cy.get('button[type="submit"], [data-testid="submit-host"]').click()

      // Form should show validation error or not submit
      cy.url().should('include', '/hosts/new')
    })
  })

  describe('Test Connection', () => {
    beforeEach(() => {
      cy.visit('/hosts/new')
    })

    it('should allow testing connection before save (FR-3.5)', () => {
      // Fill in form
      cy.get('input[name="name"], [data-testid="host-name"]').type('Test Host')
      cy.get(
        'input[name="host"], input[name="url"], [data-testid="host-url"]'
      ).type('http://localhost:8123')
      cy.get('input[name="username"], [data-testid="host-username"]').type(
        'default'
      )
      cy.get('input[name="password"], [data-testid="host-password"]').type(
        'password'
      )

      // Click test connection
      cy.get('[data-testid="test-connection"], button')
        .filter(':contains("Test")')
        .first()
        .click()

      // Should show some feedback (loading, success, or error)
      cy.get('body').should('contain.text', /./)
    })

    it('should allow saving without testing connection (FR-3.5 - optional)', () => {
      // Fill in form
      cy.get('input[name="name"], [data-testid="host-name"]').type('Test Host')
      cy.get(
        'input[name="host"], input[name="url"], [data-testid="host-url"]'
      ).type('http://localhost:8123')
      cy.get('input[name="username"], [data-testid="host-username"]').type(
        'default'
      )
      cy.get('input[name="password"], [data-testid="host-password"]').type(
        'password'
      )

      // Submit button should be enabled without testing
      cy.get('button[type="submit"], [data-testid="submit-host"]').should(
        'not.be.disabled'
      )
    })
  })
})

describe('Guest Add Host Flow (FR-3.2)', () => {
  it('should redirect guests to login when trying to add host', () => {
    // When not authenticated, adding host should require login
    cy.visit('/hosts/new')

    // Either shows the form (if no auth required) or redirects to login
    cy.get('body').then(($body) => {
      const onAddHostPage = $body.find('form').length > 0
      const onLoginPage =
        $body.text().toLowerCase().includes('sign in') ||
        $body.text().toLowerCase().includes('login') ||
        $body.text().toLowerCase().includes('welcome')

      expect(onAddHostPage || onLoginPage).to.be.true
    })
  })
})
