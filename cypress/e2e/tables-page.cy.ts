// describe('Page /tables', () => {
//   it('should redirect to /tables/[database]', () => {
//     cy.visit('/tables', { failOnStatusCode: false })
//
//     cy.contains('Redirecting to /tables/')
//
//     // Should redirect to /tables/[database]
//     cy.url().should('match', /\/tables\/\w+/)
//   })
// })

// Required: https://github.com/duyet/docker-images/blob/master/clickhouse-server/clickhouse_testing/docker-entrypoint-initdb.d/init-db.sh
describe('Page /database/data_lake', () => {
  it('renders', () => {
    cy.visit('/database/data_lake')

    // Should have table
    cy.get('table').should('exist')

    // Should have tabs
    // cy.get('[role="tablist"]')
    //   .should('exist')
    //   .children('[role="tab"]')
    //   .should('have.length.at.least', 1)

    // // Should have "default" or "system" tab at least
    // cy.get('[role="tab"]').contains(/system|default/g)
  })

  // it('should able to switch tabs', () => {
  //   cy.visit('/database/data_lake')

  //   // Click on "system" tab
  //   cy.get('[role="tab"]').contains('system').click()

  //   // Going to /tables/system
  //   cy.location('pathname').should('match', /\/tables\/system/)

  //   // Should have "system" tab active
  //   cy.get('[role="tab"]')
  //     .contains('system')
  //     .should('have.attr', 'aria-selected', 'true')
  //   cy.get('[role="tabpanel"][data-state="active"]')
  //     .contains('system')
  //     .should('exist')

  //   // TODO: If contains another tab, click on it and check if it's active
  // })
})
