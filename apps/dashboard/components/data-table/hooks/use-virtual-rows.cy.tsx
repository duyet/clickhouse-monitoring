import { useVirtualRows } from './use-virtual-rows'

function VirtualRowsProbe({
  rowCount,
  virtualizeThreshold,
}: {
  rowCount: number
  virtualizeThreshold?: number
}) {
  const { isVirtualized, tableContainerRef } = useVirtualRows(rowCount, {
    virtualizeThreshold,
  })

  return (
    <div
      ref={tableContainerRef}
      data-virtualized={String(isVirtualized)}
      style={{ height: 200, overflow: 'auto' }}
    />
  )
}

describe('useVirtualRows', () => {
  it('keeps normal page sizes on the standard table path', () => {
    cy.mount(<VirtualRowsProbe rowCount={249} />)

    cy.get('[data-virtualized="false"]').should('exist')
  })

  it('enables virtualization for large table pages', () => {
    cy.mount(<VirtualRowsProbe rowCount={250} />)

    cy.get('[data-virtualized="true"]').should('exist')
  })

  it('supports a custom virtualization threshold', () => {
    cy.mount(<VirtualRowsProbe rowCount={20} virtualizeThreshold={10} />)

    cy.get('[data-virtualized="true"]').should('exist')
  })
})
