describe('Page /tables', () => {
  it('renders', () => {
    cy.visit('/tables')

    // Should have table
    cy.get('table').should('exist')

    // Should have tabs
    cy.get('[role="tablist"]')
      .should('exist')
      .children('[role="tab"]')
      .should('have.length.at.least', 1)

    // Should have "default" or "system" tab at least
    cy.get('[role="tab"]').contains(/system|default/g)
  })

  it('should able to switch tabs', () => {
    cy.visit('/tables')

    // Click on "system" tab
    cy.get('[role="tab"]').contains('system').click()

    // Should have "system" tab active
    cy.get('[role="tab"]')
      .contains('system')
      .should('have.attr', 'aria-selected', 'true')
    cy.get('[role="tabpanel"][data-state="active"]')
      .contains('system')
      .should('exist')

    // Click on "default" tab
    cy.get('[role="tab"]').contains('default').click()

    // Should have "default" tab active
    cy.get('[role="tab"]')
      .contains('default')
      .should('have.attr', 'aria-selected', 'true')
    cy.get('[role="tabpanel"][data-state="active"]')
      .contains('default')
      .should('exist')
  })
})
