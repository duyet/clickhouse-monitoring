import type { Row, RowData } from '@tanstack/react-table'

import { ActionItem } from './action-item'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HostProvider } from '@/lib/swr/host-context'

// ActionItem needs DropdownMenu parent context and HostProvider
function MountWrapper({ children }: { children: React.ReactNode }) {
  return (
    <HostProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>{children}</DropdownMenuContent>
      </DropdownMenu>
    </HostProvider>
  )
}

describe('<ActionItem />', () => {
  const mockRow = {
    index: 0,
    getIsExpanded: () => false,
    toggleExpanded: () => {},
    getValue: () => undefined,
  } as unknown as Row<RowData>

  beforeEach(() => {
    cy.stub(console, 'error').as('consoleError')
    cy.intercept('**', { statusCode: 200, body: {} })
  })

  it('renders kill-query action', () => {
    cy.mount(
      <MountWrapper>
        <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
      </MountWrapper>
    )
    cy.contains('button', 'Open').click()
    cy.contains('Kill Query').should('be.visible')
  })

  it('renders explain-query action', () => {
    cy.mount(
      <MountWrapper>
        <ActionItem row={mockRow} action="explain-query" value="query-id-123" />
      </MountWrapper>
    )
    cy.contains('button', 'Open').click()
    cy.contains('Explain Query').should('be.visible')
  })

  it('renders optimize action', () => {
    cy.mount(
      <MountWrapper>
        <ActionItem row={mockRow} action="optimize" value="database.table" />
      </MountWrapper>
    )
    cy.contains('button', 'Open').click()
    cy.contains('Optimize Table').should('be.visible')
  })

  it('renders query-settings action', () => {
    cy.mount(
      <MountWrapper>
        <ActionItem
          row={mockRow}
          action="query-settings"
          value="query-id-123"
        />
      </MountWrapper>
    )
    cy.contains('button', 'Open').click()
    cy.contains('Query Settings').should('be.visible')
  })

  it('renders unknown action as fallback', () => {
    cy.mount(
      <MountWrapper>
        <ActionItem row={mockRow} action="unknown-action" value="test-value" />
      </MountWrapper>
    )
    cy.contains('unknown-action').should('not.exist')
  })

  it('renders inside a dropdown menu item', () => {
    cy.mount(
      <MountWrapper>
        <ActionItem row={mockRow} action="kill-query" value="query-id-123" />
      </MountWrapper>
    )
    cy.contains('button', 'Open').click()
    cy.get('[role="menuitem"]').should('exist')
  })
})
