import type { QueryConfig } from '@/types/query-config'

import { DataTable } from './data-table'

describe('<DataTable />', () => {
  beforeEach(() => {
    cy.viewport(1024, 768)
  })

  // Define mock config
  const queryConfig: QueryConfig = {
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

    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={data}
        context={{}}
      />
    )

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
    const data = []

    for (let i = 0; i < 100; i++) {
      data.push({ col1: `val${i}`, col2: `val${i}` })
    }

    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={data}
        context={{}}
        defaultPageSize={50}
      />
    )

    // "Go to previous page" button should be disabled
    cy.get('button[aria-label="Go to previous page"]').should('be.disabled')
    // "Go to next page" button should be enabled
    cy.get('button[aria-label="Go to next page"]').should('be.enabled')

    // Contains 100 rows
    cy.get('div').contains(`${data.length} row`, { matchCase: false })

    // "Rows per page" should be 50
    cy.get('div')
      .contains('Rows per page')
      .parent()
      .get('button')
      .contains('50')

    cy.get('div').contains('1–50 of 100 rows')
  })

  it('render paging, click on next page', () => {
    const data = []

    for (let i = 0; i < 10; i++) {
      data.push({ col1: `val${i}`, col2: `val${i}` })
    }

    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={data}
        context={{}}
        defaultPageSize={2}
      />
    )

    cy.get('div').contains('1–2 of 10 rows')

    // "Go to next page" button should be enabled
    cy.get('button[aria-label="Go to next page"]').should('be.enabled')
  })

  it('keeps large paginated pages on the standard table path', () => {
    const data = Array.from({ length: 300 }, (_, index) => ({
      col1: `val${index}`,
      col2: `val${index}`,
    }))

    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={data}
        context={{}}
        defaultPageSize={200}
      />
    )

    cy.get('[role="region"]').should('not.have.attr', 'style')
    cy.get('tbody tr').should('have.length', 200)
    cy.get('div').contains('1–200 of 300 rows')
  })

  it('selects rows with accessible checkbox states', () => {
    const data = [
      { col1: 'val1', col2: 'val1' },
      { col1: 'val2', col2: 'val2' },
      { col1: 'val3', col2: 'val3' },
    ]

    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={data}
        context={{}}
        enableRowSelection
      />
    )

    cy.get('table [role="checkbox"][aria-label="Select all rows"]')
      .should('have.attr', 'aria-checked', 'false')
      .click()
      .should('have.attr', 'aria-checked', 'true')

    cy.get('table [role="checkbox"][aria-label="Select row"]')
      .should('have.length', 3)
      .each(($checkbox) => {
        expect($checkbox).to.have.attr('aria-checked', 'true')
      })

    cy.get('table [role="checkbox"][aria-label="Select row"]').first().click()

    cy.get('table [role="checkbox"][aria-label="Select all rows"]').should(
      'have.attr',
      'aria-checked',
      'mixed'
    )
  })

  it('notifies consumers when row selection changes', () => {
    const onRowSelectionChange = cy.stub().as('onRowSelectionChange')

    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={[{ col1: 'val1', col2: 'val1' }]}
        context={{}}
        enableRowSelection
        onRowSelectionChange={onRowSelectionChange}
      />
    )

    cy.get('table [role="checkbox"][aria-label="Select row"]').click()

    cy.get('@onRowSelectionChange').should('have.been.calledWith', { 0: true })
  })

  it('should adjust column visibility, hide col1', () => {
    // Define some mock data
    const data = [
      { col1: 'val1', col2: 'val1' },
      { col1: 'val2', col2: 'val2' },
      { col1: 'val3', col2: 'val3' },
    ]

    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={data}
        context={{}}
      />
    )

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

    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={data}
        context={{}}
      />
    )

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

    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={data}
        context={{}}
      />
    )

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
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={[]}
        context={{}}
        showSQL={true}
      />
    )

    cy.get('button[aria-label="Open chart actions"]').should('exist')
  })

  it('should not have "Show Code" button when showSQL={false}', () => {
    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={[]}
        context={{}}
        showSQL={false}
      />
    )

    cy.get('button[aria-label="Open chart actions"]').should('not.exist')
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
        queryConfig={queryConfig}
        data={data}
        context={{}}
        showSQL={true}
      />
    )

    cy.get('button[aria-label="Open chart actions"]').click()
    cy.contains('[role="menuitem"]', 'Request Info').click()

    // Showing dialog contains the current SQL code
    cy.get('pre').contains(queryConfig.sql)

    // Click to dismiss the dialog
    cy.get('[role="dialog"] button').last().click()

    // Dialog should be closed
    cy.get('pre').should('not.exist')
  })

  it('should display with footnote prop as text', () => {
    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={[]}
        context={{}}
        footnote="This is footnote"
      />
    )

    cy.get('div').contains('This is footnote')
  })

  it('should display with footnote prop as elemenent', () => {
    cy.mount(
      <DataTable
        title="Test Table"
        queryConfig={queryConfig}
        data={[]}
        context={{}}
        footnote={<div className="footnote">This is footnote</div>}
      />
    )

    cy.get('.footnote').contains('This is footnote').should('exist')
  })

  it('should display without footnote props, with 1 row, pageSize=10', () => {
    cy.mount(
      <DataTable
        queryConfig={queryConfig}
        data={[{ col1: '1', col2: '2' }]}
        context={{}}
        defaultPageSize={10}
      />
    )

    cy.contains('0 of 1 row(s)')
    cy.get('[aria-label="Pagination"]').should('is.not.visible')
  })

  it('should display without footnote, with 10 row, pageSize=10', () => {
    const data = []
    for (let i = 0; i < 10; i++) {
      data.push({ col1: '1', col2: '2' })
    }

    cy.mount(
      <DataTable
        queryConfig={queryConfig}
        data={data}
        defaultPageSize={10}
        context={{}}
      />
    )
    cy.contains('0 of 10 row(s)')
  })

  describe('column resizing', () => {
    const resizeData = [
      { col1: 'aaa', col2: 'bbb' },
      { col1: 'ccc', col2: 'ddd' },
    ]

    it('renders resize handles by default', () => {
      cy.mount(
        <DataTable queryConfig={queryConfig} data={resizeData} context={{}} />
      )

      // One resizer per resizable column header
      cy.get('thead [role="separator"][aria-orientation="vertical"]').should(
        'have.length.at.least',
        queryConfig.columns.length
      )
    })

    it('omits resize handles when tableBehavior.enableColumnResizing is false', () => {
      const lockedConfig: QueryConfig = {
        ...queryConfig,
        tableBehavior: { enableColumnResizing: false },
      }

      cy.mount(
        <DataTable queryConfig={lockedConfig} data={resizeData} context={{}} />
      )

      cy.get('thead [role="separator"][aria-orientation="vertical"]').should(
        'not.exist'
      )
    })

    it('updates column width when dragging the resize handle', () => {
      cy.viewport(1024, 768)
      cy.mount(
        <DataTable
          queryConfig={queryConfig}
          data={resizeData}
          context={{}}
          enableColumnReordering={false}
        />
      )

      // The first column's rendered getSize() before resizing (the inline cell
      // width reflects column.getSize(), independent of how auto-layout may
      // stretch the visible column to fill the container).
      cy.get('tbody td')
        .first()
        .then(($td) => Number.parseFloat($td[0].style.width))
        .then((startSize) => {
          // Real CDP events: synthetic .trigger() events do not drive
          // TanStack's document-level mouse resize listeners reliably.
          cy.get('thead [role="separator"][aria-orientation="vertical"]')
            .first()
            .realMouseDown()
          cy.get('thead [role="separator"][aria-orientation="vertical"]')
            .first()
            .realMouseMove(120, 2)
          cy.get('thead [role="separator"][aria-orientation="vertical"]')
            .first()
            .realMouseUp()

          cy.get('tbody td')
            .first()
            .should(($td) => {
              const size = Number.parseFloat($td[0].style.width)
              expect(size).to.be.greaterThan(startSize + 50)
            })
        })
    })
  })

  describe('column sorting', () => {
    const sortData = [
      { col1: 'banana', col2: '3' },
      { col1: 'apple', col2: '1' },
      { col1: 'cherry', col2: '2' },
    ]

    it('sorts ascending then descending when the header is clicked', () => {
      cy.mount(
        <DataTable
          queryConfig={queryConfig}
          data={sortData}
          context={{}}
          enableColumnReordering={false}
        />
      )

      // Initial natural order
      cy.get('tbody tr').eq(0).should('contain.text', 'banana')

      // First click → ascending (apple, banana, cherry)
      cy.get('button[aria-label="Sort by col1"]').click()
      cy.get('tbody tr').eq(0).should('contain.text', 'apple')
      cy.get('tbody tr').eq(1).should('contain.text', 'banana')
      cy.get('tbody tr').eq(2).should('contain.text', 'cherry')

      // Second click → descending (cherry, banana, apple)
      cy.get('button[aria-label="Sort by col1"]').click()
      cy.get('tbody tr').eq(0).should('contain.text', 'cherry')
      cy.get('tbody tr').eq(2).should('contain.text', 'apple')
    })

    it('does not sort when tableBehavior.enableSorting is false', () => {
      const lockedConfig: QueryConfig = {
        ...queryConfig,
        tableBehavior: { enableSorting: false },
      }

      cy.mount(
        <DataTable
          queryConfig={lockedConfig}
          data={sortData}
          context={{}}
          enableColumnReordering={false}
        />
      )

      // Sort control is disabled when sorting is locked off
      cy.get('thead th').first().find('button').first().should('be.disabled')
      // A forced click must still not reorder rows
      cy.get('thead th').first().find('button').first().click({ force: true })
      cy.get('tbody tr').eq(0).should('contain.text', 'banana')
      cy.get('tbody tr').eq(1).should('contain.text', 'apple')
      cy.get('tbody tr').eq(2).should('contain.text', 'cherry')
    })
  })

  describe('action columns', () => {
    it('renders action columns at a compact width and not resizable', () => {
      cy.viewport(400, 768)
      const actionConfig: QueryConfig = {
        name: 'with-action',
        sql: '/* No need */',
        columns: ['action', 'query_id', 'message'],
        columnFormats: {
          action: ['action', []] as never,
        },
      }
      const data = [{ action: '', query_id: 'abc-123', message: 'hello' }]

      cy.mount(
        <DataTable
          queryConfig={actionConfig}
          data={data}
          context={{}}
          enableColumnReordering={false}
        />
      )

      // Action column is capped compact via maxSize (80px) instead of the
      // 180px default. Rendered width can stretch when an auto-layout table
      // fills a wide container, so assert the applied cap, not outerWidth.
      cy.get('thead th').first().should('have.css', 'max-width', '80px')

      // No resizer on the action column
      cy.get('thead th')
        .first()
        .find('[role="separator"][aria-orientation="vertical"]')
        .should('not.exist')
    })

    it('does NOT cap inline-action columns (multi-button rows like running-queries)', () => {
      const inlineActionConfig: QueryConfig = {
        name: 'with-inline-action',
        sql: '/* No need */',
        columns: ['action', 'query'],
        columnFormats: {
          action: ['inline-action', []] as never,
        },
      }

      cy.mount(
        <DataTable
          queryConfig={inlineActionConfig}
          data={[{ action: 'abc-123', query: 'SELECT 1' }]}
          context={{}}
        />
      )

      // Inline-action column should keep the standard defaultColumn width
      // (180px) so multiple icon buttons fit, and the resize handle must
      // still be present.
      cy.get('thead th').first().invoke('outerWidth').should('be.gt', 80)
      cy.get('thead th')
        .first()
        .find('[role="separator"][aria-orientation="vertical"]')
        .should('exist')
    })
  })

  describe('header layout', () => {
    it('truncates long header text instead of overlapping neighboring columns', () => {
      const longHeaderConfig: QueryConfig = {
        name: 'long',
        sql: '/* No need */',
        columns: ['a_very_long_column_name_that_should_truncate', 'col2'],
      }

      cy.mount(
        <DataTable
          queryConfig={longHeaderConfig}
          data={[
            { a_very_long_column_name_that_should_truncate: 'x', col2: 'y' },
          ]}
          context={{}}
        />
      )

      // The truncate utility puts overflow:hidden on the header text span.
      cy.get('thead th')
        .first()
        .find('.truncate')
        .should('have.css', 'overflow-x', 'hidden')
    })
  })
})
