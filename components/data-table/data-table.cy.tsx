import React from 'react'

import { QueryConfig } from '@/lib/clickhouse-queries'

import { DataTable } from './data-table'

describe('<DataTable />', () => {
  // Define mock config
  const config: QueryConfig = {
    name: 'settings',
    sql: '/* No need */',
    columns: ['col1', 'col2'],
  }

  it('renders', () => {
    // Define some mock data
    const data = [
      { col1: 'val1', col2: 'val1' },
      { col1: 'val2', col2: 'val2' },
      { col1: 'val3', col2: 'val3' },
    ]

    cy.mount(<DataTable title="Test Table" config={config} data={data} />)

    cy.get('h1').contains('Test Table')
    cy.get('table').should('have.length', 1)
    cy.get('thead').should('have.length', 1)
    cy.get('thead').contains('col1')
    cy.get('thead').contains('col2')
    cy.get('tbody').contains('val1')
    cy.get('tbody').contains('val2')
    cy.get('div').contains(`${data.length} row`, { matchCase: false })
  })

  it('render paging', () => {
    let data = []

    for (let i = 0; i < 100; i++) {
      data.push({ col1: `val${i}`, col2: `val${i}` })
    }

    cy.mount(
      <DataTable
        title="Test Table"
        config={config}
        data={data}
        defaultPageSize={50}
      />
    )

    // "Go to previous page" button should be disabled
    cy.get('button')
      .contains('button', 'Go to previous page')
      .should('be.disabled')
    // "Go to next page" button should be enabled
    cy.get('button').contains('button', 'Go to next page').should('be.enabled')

    // Contains 100 rows
    cy.get('div').contains(`${data.length} row`, { matchCase: false })

    // "Rows per page" should be 50
    cy.get('div')
      .contains('Rows per page')
      .parent()
      .get('button')
      .contains('50')

    // Page 1 of 2
    cy.get('div').contains('Page 1 of 2')
  })

  it('render paging, click on next page', () => {
    let data = []

    for (let i = 0; i < 100; i++) {
      data.push({ col1: `val${i}`, col2: `val${i}` })
    }

    cy.mount(
      <DataTable
        title="Test Table"
        config={config}
        data={data}
        defaultPageSize={50}
      />
    )

    // Page 1 of 2
    cy.get('div').contains('Page 1 of 2')

    // "Go to next page" button should be enabled
    cy.get('button')
      .contains('button', 'Go to next page')
      .should('be.enabled')
      .click()

    // Page 2 of 2
    cy.get('div').contains('Page 2 of 2')
  })

  it('should adjust column visibility', () => {
    // Define some mock data
    const data = [
      { col1: 'val1', col2: 'val1' },
      { col1: 'val2', col2: 'val2' },
      { col1: 'val3', col2: 'val3' },
    ]

    cy.mount(<DataTable title="Test Table" config={config} data={data} />)

    // Before click: table should contains 2 columns
    cy.get('thead tr th').should('have.length', 2)

    // Click on "Column Options" button, should showing 2 checkboxes: col1 and col2
    // Click on col1 to toggle hide it
    cy.get('button[aria-label="Column Options"]').click()
    cy.get('[role="checkbox"]').should('have.length', 2)
    cy.get('[role="checkbox"]').contains('col1').click()

    // After click: table should contains only col2
    cy.get('thead tr th').should('have.length', 1)

    // Click on "Column Options" button, should showing 2 checkboxes: col1 and col2
    // Click on col2 to toggle hide it
    cy.get('button[aria-label="Column Options"]').click()
    cy.get('[role="checkbox"]').should('have.length', 2)
    cy.get('[role="checkbox"]').contains('col2').click()

    // After click: table should contains no column
    cy.get('thead tr th').should('have.length', 0)

    // Click on "Column Options" button, should showing 2 checkboxes: col1 and col2
    // Click on col2 to toggle show it again
    cy.get('button[aria-label="Column Options"]').click()
    cy.get('[role="checkbox"]').should('have.length', 2)
    cy.get('[role="checkbox"]').contains('col1').click()
    cy.get('button[aria-label="Column Options"]').click()
    cy.get('[role="checkbox"]').contains('col2').click()

    cy.get('thead tr th').should('have.length', 2)
  })
})
