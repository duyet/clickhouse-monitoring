import type { QueryConfig } from '@/types/query-config'

import { DataTable } from '../data-table'

describe('<DataTable /> with expandable rows', () => {
  beforeEach(() => {
    cy.viewport(1024, 768)
  })

  const queryConfig: QueryConfig = {
    name: 'expandable-test',
    sql: 'SELECT * FROM test',
    columns: ['id', 'name'],
  }

  const data = [
    { id: '1', name: 'alpha' },
    { id: '2', name: 'beta' },
    { id: '3', name: 'gamma' },
  ]

  it('renders chevrons, expands a row on click, and collapses it again', () => {
    cy.mount(
      <DataTable
        title="Expandable"
        queryConfig={queryConfig}
        data={data}
        context={{}}
        expandable={{
          renderExpanded: (row) => {
            const id = String((row as { id: string }).id)
            return <div data-testid={`details-${id}`}>DETAILS {id}</div>
          },
        }}
      />
    )

    // Three data rows, each with an expand chevron
    cy.get('tbody tr').should('have.length', 3)
    cy.get('button[aria-label="Expand row"]').should('have.length', 3)

    // Click the second row's chevron and assert the expanded row appears
    cy.get('button[aria-label="Expand row"]').eq(1).click()
    cy.get('tr[data-expanded-row]').should('have.length', 1)
    cy.get('tr[data-expanded-row]').contains('DETAILS 2').should('be.visible')

    // Chevron flips to Collapse row
    cy.get('button[aria-label="Collapse row"]').should('have.length', 1)

    // Click again to collapse
    cy.get('button[aria-label="Collapse row"]').click()
    cy.get('tr[data-expanded-row]').should('not.exist')
    cy.get('button[aria-label="Expand row"]').should('have.length', 3)
  })
})
