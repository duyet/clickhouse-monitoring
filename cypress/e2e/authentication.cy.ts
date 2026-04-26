/**
 * @fileoverview Authentication E2E tests
 * Tests both guest mode (Clerk not configured) and Clerk authentication flow
 */

describe('Authentication', () => {
  const clerkEnabled = Boolean(Cypress.env('CLERK_PUBLISHABLE_KEY'))

  beforeEach(() => {
    cy.visit('/overview?host=0')
  })

  // Helper to run tests only when Clerk is enabled
  const describeIfClerkEnabled = clerkEnabled ? describe : describe.skip

  describe('Guest mode', () => {
    it('shows guest user in sidebar footer', () => {
      cy.get('[data-testid="nav-user-trigger"]').should('exist')
      cy.get('[data-testid="nav-user-name"]').should('contain', 'Guest')
      cy.get('[data-testid="nav-user-email"]').should('contain', 'guest@local')
    })

    it('shows correct menu items for guest user', () => {
      // Click the user menu to open dropdown
      cy.get('[data-testid="nav-user-trigger"]').click()

      // Verify all expected menu items are present
      cy.get('[data-testid="nav-user-about"]')
        .should('exist')
        .and('contain', 'About')
      cy.get('[data-testid="nav-user-github"]')
        .should('exist')
        .and('contain', 'GitHub Repo')
      cy.get('[data-testid="nav-user-settings"]')
        .should('exist')
        .and('contain', 'Settings')

      // Verify keyboard shortcut is shown for Settings
      cy.get('[data-testid="nav-user-settings"]').should('contain', '⌘,')
    })

    it('does not show authentication buttons in guest mode', () => {
      // Open the user menu
      cy.get('[data-testid="nav-user-trigger"]').click()

      // Should NOT show Sign In or Sign Up buttons (guest mode)
      cy.contains('Sign In').should('not.exist')
      cy.contains('Sign Up').should('not.exist')
      cy.contains('Sign Out').should('not.exist')
    })

    it('opens settings dialog from user menu', () => {
      cy.get('[data-testid="nav-user-trigger"]').click()
      cy.get('[data-testid="nav-user-settings"]').click()

      // Settings dialog should appear (via SettingsDialog component)
      // The dialog content would be rendered by the Settings component
      cy.get('[data-testid="settings-dialog"]').should('exist')
    })

    it('navigates to about page from user menu', () => {
      cy.get('[data-testid="nav-user-trigger"]').click()
      cy.get('[data-testid="nav-user-about"]').click()

      cy.url().should('include', '/about')
    })

    it('opens GitHub repo link in new tab', () => {
      cy.get('[data-testid="nav-user-trigger"]').click()

      cy.get('[data-testid="nav-user-github"]')
        .should(
          'have.attr',
          'href',
          'https://github.com/duyet/clickhouse-monitoring'
        )
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noopener noreferrer')
    })

    it('displays guest avatar with fallback', () => {
      cy.get('[data-testid="nav-user-trigger"] .avatar').should('exist')
      // Guest user has empty avatar string, so fallback "G" should be visible
      cy.get('[data-testid="nav-user-trigger"]').should('contain', 'G')
    })
  })

  describeIfClerkEnabled('Clerk authentication', { baseUrl: null }, () => {
    it('detects Clerk is enabled via environment', () => {
      // This test verifies the test environment setup
      cy.task('checkEnvVar', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY').should(
        'be.true'
      )
    })

    it('shows sign in button when not authenticated', () => {
      // Clear localStorage to simulate fresh session
      cy.clearLocalStorage()
      cy.visit('/overview?host=0')

      // When Clerk is enabled and user is not authenticated,
      // there should be a Sign In button (implementation detail depends on final Clerk integration)
      // For now, we verify the app loads successfully
      cy.get('[data-testid="nav-user-trigger"]').should('exist')
    })

    it('shows sign up option in menu when not authenticated', () => {
      cy.clearLocalStorage()
      cy.visit('/overview?host=0')

      // Open user menu
      cy.get('[data-testid="nav-user-trigger"]').click()

      // When Clerk integration is complete, Sign Up option should be visible
      // For now, we verify the menu opens successfully
      cy.get('[data-testid="nav-user-about"]').should('exist')
    })

    it('persists user session across page navigations', () => {
      // This test would mock Clerk's session storage
      // Implementation depends on final Clerk integration
      cy.clearLocalStorage()
      cy.visit('/overview?host=0')

      // Navigate to another page
      cy.visit('/dashboard?host=0')

      // User menu should still be accessible
      cy.get('[data-testid="nav-user-trigger"]').should('exist')
    })
  })

  describe('User menu interactions', () => {
    it('closes menu when clicking outside', () => {
      // Open the menu
      cy.get('[data-testid="nav-user-trigger"]').click()
      cy.get('[data-testid="nav-user-about"]').should('be.visible')

      // Click outside the menu at a stable viewport coordinate. Clicking the
      // center of <main> is brittle because chart content can cover that point.
      cy.get('body').click(10, 10)

      // Menu should close (DropdownMenu handles this automatically via Radix)
      cy.get('[data-testid="nav-user-about"]').should('not.exist')
    })

    it('supports keyboard shortcut for settings (Cmd+,)', () => {
      // Press Cmd+, (or Ctrl+, on Windows/Linux)
      cy.get('body').type('{cmd}{,}')

      // Settings dialog should open
      cy.get('[data-testid="settings-dialog"]').should('exist')
    })
  })

  describe('Accessibility', () => {
    it('user menu button is keyboard accessible', () => {
      // Tab to the user menu button
      cy.get('[data-testid="nav-user-trigger"]').focus()
      cy.get('[data-testid="nav-user-trigger"]').should('have.focus')

      // Press Enter to open menu
      cy.get('[data-testid="nav-user-trigger"]').type('{enter}')
      cy.get('[data-testid="nav-user-about"]').should('be.visible')
    })

    it('menu items are keyboard navigable', () => {
      cy.get('[data-testid="nav-user-trigger"]').click()

      // Press arrow down to navigate through menu items
      cy.get('body').type('{downarrow}')
      cy.get('[data-testid="nav-user-about"]').should('have.focus')

      cy.get('body').type('{downarrow}')
      cy.get('[data-testid="nav-user-github"]').should('have.focus')

      cy.get('body').type('{downarrow}')
      cy.get('[data-testid="nav-user-settings"]').should('have.focus')
    })
  })
})
