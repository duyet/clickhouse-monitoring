/**
 * @fileoverview Navigation E2E tests with query parameter routing
 * Tests the new static site architecture with ?host= query parameters
 *
 * Note: This test file matches the current menu structure:
 * - Overview (top-level)
 * - Queries (dropdown with Running Queries, History Queries, etc.)
 * - Tables (dropdown with Database Explorer, Tables Overview, etc.)
 * - Merges (dropdown with Merges, Merge Performance, Mutations)
 * - Monitoring (dropdown with Metrics, Async Metrics, Custom Dashboard)
 * - Security, Logs, System, Cluster, Operations (other sections)
 */

describe('Navigation Tests (Query Parameter Routing)', () => {
  beforeEach(() => {
    cy.visit('/overview?host=0', { timeout: 30000 })
    // Wait for page to be interactive
    cy.get('body', { timeout: 20000 }).should('exist')
  })

  it('should open overview page with query parameter', () => {
    // Verify URL has query parameter
    cy.url().should('include', '/overview')
    cy.url().should('include', 'host=0')
  })

  it('should navigate to merges section via menu', () => {
    // Click on "Merges" menu item (it's a dropdown trigger)
    cy.contains('button', 'Merges').click()

    // Wait for dropdown content and click on Merges submenu item (first one)
    cy.contains('Merge Performance').should('be.visible')

    // Click on the first "Merges" link in the dropdown (not the trigger)
    cy.contains('a', 'Merges').click()

    // Verify navigation to merges page with host parameter
    cy.url().should('include', '/merges')
    cy.url().should('include', 'host=0')
  })

  it('should navigate to running queries via Queries menu', () => {
    // Click on "Queries" menu item (dropdown trigger)
    cy.contains('button', 'Queries').click()

    // Wait for dropdown to appear and click Running Queries
    cy.contains('Running Queries').should('be.visible')
    cy.contains('a', 'Running Queries').click()

    // Verify navigation
    cy.url().should('include', '/running-queries')
    cy.url().should('include', 'host=0')
  })

  it('should navigate to tables via Tables menu', () => {
    // Click on "Tables" menu item (dropdown trigger)
    cy.contains('button', 'Tables').click()

    // Wait for dropdown to appear and click Database Explorer
    cy.contains('Database Explorer').should('be.visible')
    cy.contains('a', 'Database Explorer').click()

    // Verify navigation
    cy.url().should('include', '/explorer')
    cy.url().should('include', 'host=0')
  })

  it('should navigate to clusters via Cluster menu', () => {
    // Click on "Cluster" menu item (dropdown trigger)
    cy.contains('button', 'Cluster').click()

    // Wait for dropdown to appear and click Clusters (look for link containing "Clusters")
    cy.contains('a', 'Clusters').should('be.visible')
    cy.contains('a', 'Clusters').click()

    // Verify navigation
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

    // /tables redirects to /explorer, test separately
    cy.visit('/tables?host=0', { timeout: 30000 })
    cy.url().should('include', '/explorer')
    cy.url().should('include', 'host=0')
    cy.get('body').should('exist')
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
    // Wait for page to be fully loaded - sidebar takes some time to render
    cy.get('body', { timeout: 20000 }).should('exist')
  })

  it('should display all main menu sections', () => {
    // The app uses sidebar navigation - menu items are in the sidebar
    // Check that the sidebar exists and contains main navigation items
    cy.get('body').should('contain', 'Overview')
    cy.get('body').should('contain', 'Queries')
    cy.get('body').should('contain', 'Tables')
    cy.get('body').should('contain', 'Merges')
  })

  it('should show submenu items on click', () => {
    // Click on Queries menu
    cy.contains('button', 'Queries').click()

    // Verify submenu items appear
    cy.contains('Running Queries').should('be.visible')
    cy.contains('History Queries').should('be.visible')
  })

  it('should navigate to overview from menu', () => {
    // First go to a different page
    cy.visit('/dashboard?host=0')

    // Then click Overview (it's a direct link, not dropdown)
    cy.contains('a', 'Overview').click()
    cy.url().should('include', '/overview')
  })

  it('should navigate to dashboard via Monitoring menu', () => {
    // Click on Monitoring menu
    cy.contains('button', 'Monitoring').click()

    // Wait for dropdown and verify Custom Dashboard link is visible
    cy.contains('Custom Dashboard').should('be.visible')
    cy.contains('a', 'Custom Dashboard').should('be.visible').click()

    // Verify navigation to dashboard with host parameter
    cy.url().should('include', '/dashboard')
    cy.url().should('include', 'host=0')
  })

  it('should navigate to settings via System menu', () => {
    // Click on System menu
    cy.contains('button', 'System').click()

    // Click on Settings link
    cy.contains('a', 'Settings').should('be.visible')
    cy.contains('a', 'Settings').click()

    // Settings is now a modal dialog, check for dialog content
    cy.contains('[role="dialog"]', 'Settings').should('be.visible')
  })
})
