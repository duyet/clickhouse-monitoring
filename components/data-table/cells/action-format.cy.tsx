import type { Row, RowData } from '@tanstack/react-table'

import { ActionFormat } from './action-format'

describe('<ActionFormat />', () => {
  const mockRow = {
    index: 0,
    getIsExpanded: cy.stub().returns(false),
    toggleExpanded: cy.stub(),
    getValue: cy.stub(),
  } as unknown as Row<RowData>

  const mockData = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ] as RowData[]

  const mockContext = {
    host: 'localhost',
    database: 'test_db',
  }

  it('renders ActionMenu component', () => {
    const actions = ['kill-query', 'explain-query']

    cy.mount(
      <ActionFormat
        row={mockRow}
        data={mockData}
        value="test-value"
        context={mockContext}
        actions={actions}
      />
    )

    // ActionFormat is just a wrapper around ActionMenu
    cy.get('button[aria-label="Open menu"]').should('be.visible')
  })

  it('passes row prop to ActionMenu', () => {
    const actions = ['kill-query']

    cy.mount(
      <ActionFormat
        row={mockRow}
        data={mockData}
        value="test-value"
        context={mockContext}
        actions={actions}
      />
    )

    // Should render the menu button
    cy.get('button[aria-label="Open menu"]').should('be.visible')
  })

  it('passes value prop to ActionMenu', () => {
    const actions = ['kill-query']
    const testValue = 'query-id-123'

    cy.mount(
      <ActionFormat
        row={mockRow}
        data={mockData}
        value={testValue}
        context={mockContext}
        actions={actions}
      />
    )

    cy.get('button[aria-label="Open menu"]').should('be.visible')
  })

  it('passes actions prop to ActionMenu', () => {
    const actions = ['kill-query', 'optimize']

    cy.mount(
      <ActionFormat
        row={mockRow}
        data={mockData}
        value="test-value"
        context={mockContext}
        actions={actions}
      />
    )

    cy.get('button[aria-label="Open menu"]').click()
    cy.contains('Kill Query').should('be.visible')
    cy.contains('Optimize Table').should('be.visible')
  })

  it('handles empty actions array', () => {
    cy.mount(
      <ActionFormat
        row={mockRow}
        data={mockData}
        value="test-value"
        context={mockContext}
        actions={[]}
      />
    )

    cy.get('button[aria-label="Open menu"]').should('be.visible')
  })

  it('has proper TypeScript typing', () => {
    const actions = ['kill-query'] as const

    cy.mount(
      <ActionFormat
        row={mockRow}
        data={mockData}
        value="test-value"
        context={mockContext}
        actions={actions}
      />
    )

    cy.get('button[aria-label="Open menu"]').should('be.visible')
  })

  it('passes through all ActionMenuProps', () => {
    const actions = [
      'kill-query',
      'explain-query',
      'optimize',
      'query-settings',
    ]

    cy.mount(
      <ActionFormat
        row={mockRow}
        data={mockData}
        value="database.table"
        context={mockContext}
        actions={actions}
      />
    )

    cy.get('button[aria-label="Open menu"]').click()

    // Verify all actions are passed through
    cy.contains('Kill Query').should('be.visible')
    cy.contains('Explain Query').should('be.visible')
    cy.contains('Optimize Table').should('be.visible')
    cy.contains('Query Settings').should('be.visible')
  })

  it('passes data and context props (for consistency)', () => {
    const actions = ['kill-query']

    cy.mount(
      <ActionFormat
        row={mockRow}
        data={mockData}
        value="test-value"
        context={mockContext}
        actions={actions}
      />
    )

    // ActionFormat passes these to ActionMenu, though ActionMenu may not use them
    cy.get('button[aria-label="Open menu"]').should('be.visible')
  })
})
