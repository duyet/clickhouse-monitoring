/// <reference types="cypress" />

/**
 * Sidebar navigation smoke tests.
 *
 * Verifies the sidebar menu renders with key sections and that
 * clicking a nav link updates the URL while preserving the host parameter.
 *
 * The app uses shadcn/ui Sidebar which renders a <div> with two attributes:
 * data-sidebar="sidebar" and data-slot="sidebar-inner". Selectors target this
 * container via data-sidebar="sidebar" (not <nav> — there is no nav element).
 * Links use TanStack Router's Link component with `to` + `search` props which
 * renders the correct href (e.g. /running-queries?host=0) on the <a> element.
 */

// Sidebar links live inside the shadcn/ui Sidebar inner container.
// The element has data-sidebar="sidebar" and data-slot="sidebar-inner".
const SIDEBAR = '[data-sidebar="sidebar"]'

/**
 * Expands a collapsible sidebar section by clicking the section button.
 * Uses the button's text content as a stable target.
 */
const expandSidebarSection = (sectionTitle: string) => {
  // Click the collapsible section button to expand its submenu items
  cy.get(`${SIDEBAR} [role="button"]:contains("${sectionTitle}")`).first().click()
}

describe('Sidebar navigation', () => {
  beforeEach(() => {
    cy.visit('/overview?host=0')
  })

  it('renders the sidebar with navigation links', () => {
    cy.get(SIDEBAR).should('exist')
    cy.get(`${SIDEBAR} a`).should('have.length.greaterThan', 0)
  })

  it('preserves host parameter when clicking a sidebar link', () => {
    // Find a sidebar link that isn't the current page (overview)
    cy.get(`${SIDEBAR} a[href*="host="]`)
      .not('[href*="/overview"]')
      .first()
      .then(($link) => {
        cy.wrap($link).click()
        cy.url().should('include', 'host=0')
        // URL should have changed from /overview
        cy.url().should('not.include', '/overview')
      })
  })

  it('navigates to running-queries via sidebar', () => {
    // Running Queries is inside the collapsible "Queries" menu
    expandSidebarSection('Queries')
    cy.get(`${SIDEBAR} a[href*="/running-queries"]`).first().click()
    cy.url().should('include', '/running-queries')
    cy.url().should('include', 'host=0')
    cy.get('body').should('exist')
  })

  it('navigates to clusters via sidebar', () => {
    // Clusters is inside the collapsible "Cluster" menu
    expandSidebarSection('Cluster')
    cy.get(`${SIDEBAR} a[href*="/clusters"]`).first().click()
    cy.url().should('include', '/clusters')
    cy.url().should('include', 'host=0')
    cy.get('body').should('exist')
  })
})
