'use client'
import { redirect, useParams } from 'next/navigation'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function DatabaseSelector({
  host,
  databases,
}: {
  host: string
  databases: string[]
}) {
  const params = useParams()

  const currentDatabase = params.database as string

  const handleSelect = (newDatabase: string) => {
    redirect(`/${host}/part-info/${newDatabase}`)
  }

  return (
    <Select value={currentDatabase} onValueChange={handleSelect}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Database" />
      </SelectTrigger>
      <SelectContent>
        {databases.map((db) => (
          <SelectItem key={db} value={db}>
            {db}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function TableSelector({
  host,
  databaseTables,
}: {
  host: string
  databaseTables: { database: string; table: string }[]
}) {
  const params = useParams()

  const currentDatabase = params.database as string
  const currentTable = params.table as string

  const handleSelect = (newTable: string) => {
    redirect(`/${host}/part-info/${currentDatabase}/${newTable}`)
  }

  return (
    <Select value={currentTable} onValueChange={handleSelect}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Table" />
      </SelectTrigger>
      <SelectContent>
        {databaseTables
          .filter(
            (item) => item.database === currentDatabase || !currentDatabase
          )
          .map((tbl) => (
            <SelectItem key={tbl.table} value={tbl.table}>
              {tbl.table}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}
