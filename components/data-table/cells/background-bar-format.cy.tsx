import { BackgroundBarFormat } from './background-bar-format'

describe('<BackgroundBarFormat />', () => {
  const mockTable = {
    getCoreRowModel: () => ({
      rows: [1, 2, 3],
    }),
  }

  const mockRow = {
    original: {
      column1: 100,
      pct_column1: 50,
      column2: 200,
      readable_column2: 'Two hundred',
      pct_column2: 75,
    },
  }

  it('renders with basic props', () => {
    cy.mount(
      <BackgroundBarFormat
        table={mockTable}
        row={mockRow}
        columnName="column1"
        value={100}
      />
    )

    cy.get('div[aria-roledescription="background-bar"]').as('cell')

    cy.get('@cell').should('contain.text', '100')
    cy.get('@cell').should('have.attr', 'title', '100 (50%)')
    cy.get('@cell')
      .should('have.css', 'background')
      .and('include', 'linear-gradient')
  })

  it('renders with numberFormat option', () => {
    cy.mount(
      <BackgroundBarFormat
        table={mockTable}
        row={mockRow}
        columnName="column1"
        value={1000}
        options={{ numberFormat: true }}
      />
    )
    cy.get('div[aria-roledescription="background-bar"]').as('cell')
    cy.get('@cell').should('contain.text', '1,000')
  })

  it('handles readable column names', () => {
    cy.mount(
      <BackgroundBarFormat
        table={mockTable}
        row={mockRow}
        columnName="readable_column2"
        value="Two hundred"
      />
    )

    cy.get('div[aria-roledescription="background-bar"]').as('cell')
    cy.get('@cell').should('contain.text', 'Two hundred')
    cy.get('@cell').should('have.attr', 'title', '200 (75%)')
  })

  it('returns raw value when table has 1 or fewer rows', () => {
    const singleRowTable = {
      getCoreRowModel: () => ({
        rows: [1],
      }),
    }

    cy.mount(
      <BackgroundBarFormat
        table={singleRowTable}
        row={mockRow}
        columnName="column1"
        value={100}
      />
    )

    cy.get('div[aria-roledescription="background-bar"]').should('not.exist')
    cy.contains('100').should('exist')
  })

  it('handles missing percentage column', () => {
    const rowWithoutPct = {
      original: {
        column1: 100,
      },
    }

    cy.mount(
      <BackgroundBarFormat
        table={mockTable}
        row={rowWithoutPct}
        columnName="column1"
        value={100}
      />
    )

    cy.get('div').should('contain.text', '100')
    cy.get('div').should('not.have.attr', 'title')
  })
})
