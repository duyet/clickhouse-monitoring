import { ExpandableCell } from '@/components/data-table/components/expandable-cell'

describe('<ExpandableCell />', () => {
  it('renders short values as plain truncated text', () => {
    cy.mount(<ExpandableCell value="short query" maxLength={20} />)

    cy.contains('short query').should('be.visible')
    cy.get('button').should('not.exist')
  })

  it('opens the full value for long text', () => {
    const value =
      'SELECT * FROM system.query_log WHERE query_duration_ms > 1000'

    cy.mount(<ExpandableCell value={value} maxLength={12} />)

    cy.get('button[title="Click to expand"]')
      .should('have.class', 'truncate')
      .click()

    cy.contains('pre', value).should('be.visible')
  })

  it('does not trigger a parent row click when opened', () => {
    const onRowClick = cy.stub().as('onRowClick')
    const value = 'A long ClickHouse exception message that should open inline'

    cy.mount(
      <div onClick={onRowClick}>
        <ExpandableCell value={value} maxLength={10} />
      </div>
    )

    cy.get('button[title="Click to expand"]').click()

    cy.get('@onRowClick').should('not.have.been.called')
    cy.contains('pre', value).should('be.visible')
  })
})
