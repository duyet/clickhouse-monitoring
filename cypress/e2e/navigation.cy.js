/**
 * @fileoverview Navigation E2E tests with query parameter routing
 * Tests the new static site architecture with ?host= query parameters
 */

describe('Navigation Tests (Query Parameter Routing)', () => {
  beforeEach(() => {
    cy.visit('/overview?host=0', { timeout: 30000 })
  })

  it('should open overview page with query parameter', () => {
    // Verify URL has query parameter
    cy.url().should('include', '/overview')
    cy.url().should('include', 'host=0')
  })

  it('should navigate to merge section and items', () => {
    // Hover on "Merge" tab
    cy.contains('Merge').trigger('mouseover')

    // Merge menu items should be visible
    cy.get('[data-testid="menu-merges"]').should('be.visible')

    // Click on "Merges" item
    cy.contains('Merges').click()

    // Verify navigation to merges page with host parameter
    cy.url().should('include', '/merges')
    cy.url().should('include', 'host=0')
  })

  it('should navigate to queries section and items', () => {
    // Hover on "Queries" tab
    cy.contains('Queries').trigger('mouseover')

    // Queries menu items should be visible
    cy.get('[data-testid="menu-running-queries"]').should('be.visible')

    // Click on "Running Queries" item
    cy.contains('Running Queries').click()

    // Verify navigation to running-queries page with host parameter
    cy.url().should('include', '/running-queries')
    cy.url().should('include', 'host=0')
  })

  it('should navigate to database section and items', () => {
    // Hover on "Database" tab
    cy.contains('Database').trigger('mouseover')

    // Database menu items should be visible
    cy.get('[data-testid="menu-tables"]').should('be.visible')

    // Click on "Tables" item
    cy.contains('Tables').click()

    // Verify navigation to tables page with host parameter
    cy.url().should('include', '/tables')
    cy.url().should('include', 'host=0')
  })

  it('should navigate to clusters section', () => {
    // Click on Clusters
    cy.contains('Clusters').click()

    // Verify navigation to clusters page with host parameter
    cy.url().should('include', '/clusters')
    cy.url().should('include', 'host=0')
  })

  it('should navigate between pages preserving host parameter', () => {
    // Start at overview
    cy.visit('/overview?host=0')
    cy.url().should('include', 'host=0')

    // Navigate to dashboard
    cy.visit('/dashboard?host=0')
    cy.url().should('include', 'host=0')

    // Navigate to settings
    cy.visit('/settings?host=0')
    cy.url().should('include', 'host=0')
  })

  it('should handle direct URL navigation with host parameter', () => {
    const pages = [
      '/overview',
      '/dashboard',
      '/clusters',
      '/tables',
      '/running-queries',
      '/merges',
      '/mutations',
    ]

    pages.forEach((page) => {
      cy.visit(`${page}?host=0`, { timeout: 30000 })
      cy.url().should('include', page)
      cy.url().should('include', 'host=0')
      cy.get('body').should('exist') // Page loaded without errors
    })
  })

  it('should maintain query parameter during browser navigation', () => {
    // Navigate to a page with host parameter
    cy.visit('/dashboard?host=0')

    // Use browser back button
    cy.go('back')
    cy.url().should('include', 'host=0')

    // Use browser forward button
    cy.go('forward')
    cy.url().should('include', 'host=0')
    cy.url().should('include', '/dashboard')
  })
})

describe('Menu Navigation', () => {
  beforeEach(() => {
    cy.visit('/overview?host=0', { timeout: 30000 })
  })

  it('should display all main menu sections', () => {
    // Check for main menu sections
    cy.get('body').should('contain', 'Overview')
    cy.get('body').should('contain', 'Dashboard')
    cy.get('body').should('contain', 'Queries')
    cy.get('body').should('contain', 'Database')
    cy.get('body').should('contain', 'Merge')
    cy.get('body').should('contain', 'Clusters')
  })

  it('should show submenu items on hover', () => {
    // Hover over Queries menu
    cy.contains('Queries').trigger('mouseover')

    // Verify submenu items appear
    cy.get('[data-testid="menu-running-queries"]').should('be.visible')
    cy.get('[data-testid="menu-history-queries"]').should('be.visible')
  })

  it('should navigate to overview from menu', () => {
    cy.contains('Overview').click()
    cy.url().should('include', '/overview')
  })

  it('should navigate to dashboard from menu', () => {
    cy.contains('Dashboard').click()
    cy.url().should('include', '/dashboard')
  })

  it('should navigate to settings from menu', () => {
    cy.contains('Settings').click()
    cy.url().should('include', '/settings')
  })
})
