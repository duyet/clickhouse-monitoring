import type { Row } from '@tanstack/react-table'

import { CodeToggleFormat } from './code-toggle-format'

function createRow(expanded = false, toggleExpanded = cy.stub()) {
  return {
    index: 0,
    getIsExpanded: cy.stub().returns(expanded),
    toggleExpanded,
  } as unknown as Row<any>
}

describe('<CodeToggleFormat />', () => {
  it('renders short code without accordion', () => {
    const shortCode = 'SELECT * FROM table'

    cy.mount(<CodeToggleFormat row={createRow()} value={shortCode} />)

    cy.get('code').should('contain.text', shortCode)
    cy.get('[data-slot="accordion-item"]').should('not.exist')
  })

  it('renders long code with collapsed accordion', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'

    cy.mount(<CodeToggleFormat row={createRow()} value={longCode} />)

    cy.get('[data-slot="accordion-item"]').should('exist')
    cy.get('[data-slot="accordion-trigger"] code')
      .should('contain.text', '...')
      .and('have.class', 'line-clamp-2')
      .and('have.class', 'truncate')
  })

  it('uses custom truncate and removes query comments', () => {
    const codeWithComment = '/* This is a comment */ SELECT * FROM table'

    cy.mount(
      <CodeToggleFormat
        row={createRow()}
        value={codeWithComment}
        options={{ hide_query_comment: true, max_truncate: 20 }}
      />
    )

    cy.get('[data-slot="accordion-trigger"] code')
      .should('not.contain.text', '/* This is a comment */')
      .invoke('text')
      .should('have.length.at.most', 23)
  })

  it('toggles accordion and calls row.toggleExpanded', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'
    const toggleExpanded = cy.stub().as('toggleExpanded')

    cy.mount(
      <CodeToggleFormat
        row={createRow(false, toggleExpanded)}
        value={longCode}
      />
    )

    cy.get('[data-slot="accordion-trigger"]').click()
    cy.get('@toggleExpanded').should('have.been.calledWith', true)
  })

  it('shows full code when the row starts expanded', () => {
    const longCode =
      'SELECT * FROM table WHERE column1 = "value" AND column2 > 100 ORDER BY column3 DESC LIMIT 10'

    cy.mount(<CodeToggleFormat row={createRow(true)} value={longCode} />)

    cy.get('[data-slot="accordion-content"] code').should(
      'contain.text',
      longCode
    )
  })
})
