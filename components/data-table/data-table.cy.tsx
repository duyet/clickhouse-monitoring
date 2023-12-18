import React from 'react'

import { type QueryConfig } from '@/lib/types/query-config'

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

    for (let i = 0; i < 10; i++) {
      data.push({ col1: `val${i}`, col2: `val${i}` })
    }

    cy.mount(
      <DataTable
        title="Test Table"
        config={config}
        data={data}
        defaultPageSize={2}
      />
    )

    // Page 1 of 2
    cy.get('div').contains('Page 1 of 5')

    // "Go to next page" button should be enabled
    cy.get('button')
      .contains('button', 'Go to next page')
      .should('be.enabled')
      .click()

    // Page 2 of 2
    cy.get('div').contains('Page 2 of 5')
  })

  it('should adjust column visibility, hide col1', () => {
    // Define some mock data
    const data = [
      { col1: 'val1', col2: 'val1' },
      { col1: 'val2', col2: 'val2' },
      { col1: 'val3', col2: 'val3' },
    ]

    cy.mount(<DataTable title="Test Table" config={config} data={data} />)

    const $optionBtn = cy.get('button[aria-label="Column Options"]')

    // Before click: table should contains 2 columns
    cy.get('thead tr th').should('have.length', 2)

    // Click on "Column Options" button, should showing 2 checkboxes: col1 and col2
    // Click on col1 to toggle hide it
    $optionBtn.click().then(() => {
      cy.get('[role="checkbox"]').should('have.length', 2)
      cy.get('[role="checkbox"]').contains('col1').click()

      // After click: table should contains only col2
      cy.get('thead tr th').should('have.length', 1)
    })
  })

  it('should adjust column visibility, hide col2', () => {
    // Define some mock data
    const data = [
      { col1: 'val1', col2: 'val1' },
      { col1: 'val2', col2: 'val2' },
      { col1: 'val3', col2: 'val3' },
    ]

    cy.mount(<DataTable title="Test Table" config={config} data={data} />)

    cy.get('button[aria-label="Column Options"]').as('btn')

    // Before click: table should contains 2 columns
    cy.get('thead tr th').should('have.length', 2)

    // Click on "Column Options" button, should showing 2 checkboxes: col1 and col2
    // Click on col2 to toggle hide it
    cy.get('@btn').click()
    cy.get('[role="checkbox"]').should('have.length', 2)
    cy.get('[role="checkbox"]').contains('col2').click()

    // After click: table should contains no column
    cy.get('thead tr th').should('have.length', 1)
  })

  it('should adjust column visibility, hide both col1 and col2', () => {
    // Define some mock data
    const data = [
      { col1: 'val1', col2: 'val1' },
      { col1: 'val2', col2: 'val2' },
      { col1: 'val3', col2: 'val3' },
    ]

    cy.mount(<DataTable title="Test Table" config={config} data={data} />)

    cy.get('button[aria-label="Column Options"]').as('btn')

    // Before click: table should contains 2 columns
    cy.get('thead tr th').should('have.length', 2)

    // Click on "Column Options" button, should showing 2 checkboxes: col1 and col2
    // Click on col1 to toggle hide it
    cy.get('@btn').click()
    // Uncheck col1
    cy.get('[role="checkbox"][aria-checked="true"][aria-label="col1"]').click()

    // After click: table should contains no column
    cy.get('thead tr th').should('have.length', 1)

    // Uncheck col2
    cy.get('@btn').click({ force: true })
    cy.get('[role="checkbox"][aria-checked="true"][aria-label="col2"]')
      .should('be.visible')
      .click({ force: true })

    // After click: table should contains no column
    cy.get('thead tr th').should('have.length', 0)
  })

  it('should have "Show Code" button when showSQL={true}', () => {
    cy.mount(
      <DataTable title="Test Table" config={config} data={[]} showSQL={true} />
    )

    cy.get('button[aria-label="Show SQL"]').should('exist')
  })

  it('should not have "Show Code" button when showSQL={false}', () => {
    cy.mount(
      <DataTable title="Test Table" config={config} data={[]} showSQL={false} />
    )

    cy.get('button[aria-label="Show SQL"]').should('not.exist')
  })

  it('should show dialog when click on "Show Code" button', () => {
    // Define some mock data
    const data = [
      { col1: 'val1', col2: 'val1' },
      { col1: 'val2', col2: 'val2' },
      { col1: 'val3', col2: 'val3' },
    ]

    cy.mount(
      <DataTable
        title="Test Table"
        config={config}
        data={data}
        showSQL={true}
      />
    )

    // Click on "Show SQL" button
    cy.get('button[aria-label="Show SQL"]').click()

    // Showing dialog contains the current SQL code
    cy.get('pre').contains(config.sql)

    // Click to dismiss the dialog
    cy.contains('[role="dialog"] button', 'Close', { matchCase: false }).click()

    // Dialog should be closed
    cy.get('pre').should('not.exist')
  })
})
