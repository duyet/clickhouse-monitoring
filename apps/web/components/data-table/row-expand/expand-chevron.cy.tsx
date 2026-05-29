import type { Row } from '@tanstack/react-table'

import { ExpandChevron } from './expand-chevron'

type FakeRow = Pick<
  Row<{ id: string }>,
  'getCanExpand' | 'getIsExpanded' | 'toggleExpanded'
>

function makeRow(opts: {
  canExpand?: boolean
  expanded?: boolean
  toggle?: () => void
}): Row<{ id: string }> {
  const fake: FakeRow = {
    getCanExpand: () => opts.canExpand ?? true,
    getIsExpanded: () => opts.expanded ?? false,
    toggleExpanded: opts.toggle ?? (() => undefined),
  }
  return fake as unknown as Row<{ id: string }>
}

describe('<ExpandChevron />', () => {
  it('renders nothing when row.canExpand is false', () => {
    const row = makeRow({ canExpand: false })
    cy.mount(<ExpandChevron row={row} />)
    cy.get('button').should('not.exist')
  })

  it('renders an expand-row button when collapsed and toggles on click', () => {
    const toggle = cy.stub().as('toggleExpanded')
    const row = makeRow({ canExpand: true, expanded: false, toggle })

    cy.mount(<ExpandChevron row={row} />)

    cy.get('button[aria-label="Expand row"]')
      .should('have.attr', 'aria-expanded', 'false')
      .click()

    cy.get('@toggleExpanded').should('have.been.calledOnce')
  })

  it('rotates chevron and updates label when expanded', () => {
    const row = makeRow({ canExpand: true, expanded: true })
    cy.mount(<ExpandChevron row={row} />)

    cy.get('button[aria-label="Collapse row"]').should(
      'have.attr',
      'aria-expanded',
      'true'
    )
    cy.get('button svg').should('have.class', 'rotate-90')
  })

  it('does not propagate click to parent handler', () => {
    const onParent = cy.stub().as('parentClick')
    const toggle = cy.stub().as('toggleExpanded')
    const row = makeRow({ canExpand: true, toggle })

    cy.mount(
      <div onClick={onParent}>
        <ExpandChevron row={row} />
      </div>
    )

    cy.get('button[aria-label="Expand row"]').click()

    cy.get('@toggleExpanded').should('have.been.calledOnce')
    cy.get('@parentClick').should('not.have.been.called')
  })
})
