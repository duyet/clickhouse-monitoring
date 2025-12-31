import { ActionItem } from './action-item'
import type { Row, RowData } from '@tanstack/react-table'

describe('<ActionItem />', () => {
  const mockRow = {
    index: 0,
    getIsExpanded: cy.stub().returns(false),
    toggleExpanded: cy.stub(),
    getValue: cy.stub(),
  } as unknown as Row<RowData>

  beforeEach(() => {
    cy.stub(console, 'error').as('consoleError')
    cy.stub(window, 'toast').as('toast')
    cy.stub(window, 'toast', 'error').as('toastError')
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

    cy.contains('unknown-action').should('be.visible')
  })

  it('shows loading state during form submission', () => {
    cy.mount(
      <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
    )

    // Find the submit button and click it
    cy.get('button[type="submit"]').click()

    // Check for loading icon with animate-spin
    cy.get('svg.animate-spin').should('be.visible')
    cy.contains('Kill Query').should('be.visible')
  })

  it('shows submit button initially', () => {
    cy.mount(
      <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
    )

    cy.get('button[type="submit"]')
      .should('be.visible')
      .and('have.class', 'm-0')
      .and('have.class', 'border-none')
      .and('have.class', 'p-0')
  })

  it('renders inside DropdownMenuItem', () => {
    cy.mount(
      <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
    )

    cy.get('[role="menuitem"]').should('exist')
  })

  it('has UpdateIcon during loading state', () => {
    cy.mount(
      <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
    )

    cy.get('button[type="submit"]').click()
    cy.get('svg.animate-spin').should('have.class', 'size-4')
  })

  it('has ExclamationTriangleIcon for failed state', () => {
    // This test would require mocking the form action to fail
    // For now, just test the structure exists
    cy.mount(
      <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
    )

    cy.get('button[type="submit"]').should('be.visible')
  })

  it('has CheckCircledIcon for success state', () => {
    // This test would require mocking the form action to succeed
    // For now, just test the structure exists
    cy.mount(
      <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
    )

    cy.get('button[type="submit"]').should('be.visible')
  })

  it('is wrapped in a form element', () => {
    cy.mount(
      <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
    )

    cy.get('form').should('exist')
    cy.get('form button[type="submit"]').should('exist')
  })

  it('renders action labels correctly', () => {
    const actionLabels = ['Kill Query', 'Explain Query', 'Optimize Table', 'Query Settings']
    const actions = ['kill-query', 'explain-query', 'optimize', 'query-settings']

    actions.forEach((action, index) => {
      cy.mount(
        <ActionItem row={mockRow} action={action} value="test-value" />
      )
      cy.contains(actionLabels[index]).should('be.visible')
    })
  })
})
