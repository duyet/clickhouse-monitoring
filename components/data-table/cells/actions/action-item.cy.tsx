import type { Row, RowData } from '@tanstack/react-table'

import { ActionItem } from './action-item'

describe('<ActionItem />', () => {
  const mockRow = {
    index: 0,
    getIsExpanded: () => false,
    toggleExpanded: () => {},
    getValue: () => undefined,
  } as unknown as Row<RowData>

  beforeEach(() => {
    cy.stub(console, 'error').as('consoleError')
  })

  it('renders kill-query action', () => {
    cy.mount(
      <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
    )

    cy.contains('Kill Query').should('be.visible')
  })

  it('renders explain-query action', () => {
    cy.mount(
      <ActionItem row={mockRow} action="explain-query" value="query-id-123" />
    )

    cy.contains('Explain Query').should('be.visible')
  })

  it('renders optimize action', () => {
    cy.mount(
      <ActionItem row={mockRow} action="optimize" value="database.table" />
    )

    cy.contains('Optimize Table').should('be.visible')
  })

  it('renders query-settings action', () => {
    cy.mount(
      <ActionItem row={mockRow} action="query-settings" value="query-id-123" />
    )

    cy.contains('Query Settings').should('be.visible')
  })

  it('renders unknown action as fallback', () => {
    cy.mount(
      <ActionItem row={mockRow} action="unknown-action" value="test-value" />
    )

    cy.contains('unknown-action').should('not.exist')
  })

  it('renders action labels correctly', () => {
    const actionLabels = [
      'Kill Query',
      'Explain Query',
      'Optimize Table',
      'Query Settings',
    ]
    const actions = [
      'kill-query',
      'explain-query',
      'optimize',
      'query-settings',
    ]

    actions.forEach((action, index) => {
      cy.mount(<ActionItem row={mockRow} action={action} value="test-value" />)
      cy.contains(actionLabels[index]).should('be.visible')
    })
  })

  it('renders inside a dropdown menu item', () => {
    cy.mount(
      <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
    )

    cy.get('[role="menuitem"]').should('exist')
  })
})
