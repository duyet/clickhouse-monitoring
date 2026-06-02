import type { Header } from '@tanstack/react-table'

import { ColumnHeaderDropdown } from '@/components/data-table/buttons/column-header-dropdown'

function createHeader({
  id = 'query',
  sorted = false,
  toggleSorting = cy.stub(),
  clearSorting = cy.stub(),
}: {
  id?: string
  sorted?: false | 'asc' | 'desc'
  toggleSorting?: Cypress.Agent<sinon.SinonStub>
  clearSorting?: Cypress.Agent<sinon.SinonStub>
} = {}) {
  return {
    column: {
      id,
      getCanSort: cy.stub().returns(true),
      getIsSorted: cy.stub().returns(sorted),
      toggleSorting,
      clearSorting,
    },
  } as unknown as Header<any, unknown>
}

function mountDropdown(header = createHeader()) {
  cy.mount(
    <div className="group p-4">
      <ColumnHeaderDropdown header={header} />
    </div>
  )
}

describe('<ColumnHeaderDropdown />', () => {
  it('opens sort and copy actions from the column options button', () => {
    mountDropdown()

    cy.get('button[aria-label="Column options"]').as('trigger').click({
      force: true,
    })
    cy.get('@trigger')
      .should('have.attr', 'data-state', 'open')
      .and('have.css', 'opacity', '1')
    cy.contains('[role="menuitem"]', /^A . Z$/).should('be.visible')
    cy.contains('[role="menuitem"]', /^Z . A$/).should('be.visible')
    cy.contains('[role="menuitem"]', 'Reset sort').should('be.visible')
    cy.contains('[role="menuitem"]', 'Copy name').should('be.visible')
  })

  it('runs ascending sort from the menu', () => {
    const toggleSorting = cy.stub().as('toggleSorting')

    mountDropdown(createHeader({ toggleSorting }))

    cy.get('button[aria-label="Column options"]').click({ force: true })
    cy.contains('[role="menuitem"]', /^A . Z$/).click()

    cy.get('@toggleSorting').should('have.been.calledWith', false)
  })

  it('resets sorting without closing the menu', () => {
    const clearSorting = cy.stub().as('clearSorting')

    mountDropdown(createHeader({ clearSorting }))

    cy.get('button[aria-label="Column options"]').click({ force: true })
    cy.contains('[role="menuitem"]', 'Reset sort').click()

    cy.get('@clearSorting').should('have.been.calledOnce')
    cy.contains('[role="menuitem"]', 'Reset sort').should('be.visible')
  })

  it('copies the column id', () => {
    const writeText = cy.stub().as('writeText')

    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      })
    })
    mountDropdown(createHeader({ id: 'query_id' }))

    cy.get('button[aria-label="Column options"]').click({ force: true })
    cy.contains('[role="menuitem"]', 'Copy name').click()

    cy.get('@writeText').should('have.been.calledWith', 'query_id')
    cy.contains('[role="menuitem"]', 'Copied!').should('be.visible')
  })
})
