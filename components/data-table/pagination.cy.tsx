import React from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { DataTablePagination } from './pagination'

describe('<DataTablePagination />', () => {
  type Row = {
    col1: string
    col2: string
  }
  const TestTable = ({ data, pageSize }: { data: Row[]; pageSize: number }) => {
    const columnHelper = createColumnHelper<Row>()

    const columns = [
      columnHelper.accessor('col1', {
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor((row) => row.col1, {
        id: 'lastName',
        cell: (info) => info.getValue(),
      }),
    ]

    const table = useReactTable({
      columns,
      data,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize,
        },
      },
    })

    return (
      <table className="border p-5">
        <thead>
          <tr>
            <th>col1</th>
            <th>col2</th>
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <DataTablePagination table={table} />
      </table>
    )
  }

  it('renders table with 1 row', () => {
    cy.mount(<TestTable data={[{ col1: '1', col2: '2' }]} pageSize={10} />)

    cy.contains('0 of 1 row(s)')
    cy.get('[aria-label="Pagination"]').should('is.not.visible')
  })

  it('renders table with 10 row, pageSize=10', () => {
    const data = []
    for (let i = 0; i < 10; i++) {
      data.push({ col1: '1', col2: '2' })
    }

    cy.mount(<TestTable data={data} pageSize={10} />)
    cy.contains('0 of 10 row(s)')
    cy.get('[aria-label="Pagination"]').should('is.not.visible')
  })

  it('renders table with 10 row, pageSize=1', () => {
    const data = []
    for (let i = 0; i < 10; i++) {
      data.push({ col1: '1', col2: '2' })
    }

    cy.mount(<TestTable data={data} pageSize={1} />)
    cy.get('[aria-label="Pagination"]').should('is.visible')
    cy.contains('Page 1 of 10')

    cy.contains('button', 'Go to next page').click()
    cy.contains('Page 2 of 10')
  })

  it('renders table with 10 row, pageSize=2', () => {
    const data = []
    for (let i = 0; i < 10; i++) {
      data.push({ col1: '1', col2: '2' })
    }

    cy.mount(<TestTable data={data} pageSize={2} />)
    cy.get('[aria-label="Pagination"]').should('is.visible')
    cy.contains('Page 1 of 5')

    cy.contains('button', 'Go to next page').click()
    cy.contains('Page 2 of 5')
  })

  it('renders table with 10 row, pageSize=10', () => {
    const data = []
    for (let i = 0; i < 10; i++) {
      data.push({ col1: '1', col2: '2' })
    }

    cy.mount(<TestTable data={data} pageSize={10} />)
    cy.get('[aria-label="Pagination"]').should('is.not.visible')
  })
})
