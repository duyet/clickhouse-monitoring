'use client'

import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { useState } from 'react'
import { useFormState } from 'react-dom'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

import { DialogSQL } from '@/components/dialog-sql'
import {
  explainAction,
  type ActionError,
  type ExplainType,
  type Explains,
} from './actions'

const initialState: Explains & Partial<ActionError> = {
  PLAN: { explain: '', sql: '' },
  ESTIMATE: { explain: '', sql: '' },
  PIPELINE: { explain: '', sql: '' },
  SYNTAX: { explain: '', sql: '' },
  'QUERY TREE': { explain: '', sql: '' },
  AST: { explain: '', sql: '' },
  error: null,
}

type ExplainPageProps = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ExplainPage({ searchParams }: ExplainPageProps) {
  const [query, setQuery] = useState(
    searchParams.query || 'SELECT * FROM numbers(100)'
  )
  const [state, formAction] = useFormState(explainAction, initialState)

  const keys = Object.keys(state).filter(
    (key) => key !== 'error' && state[key as ExplainType].explain
  )

  return (
    <form action={formAction}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between pb-4">
          <div>
            <h1 className="text-xl text-muted-foreground">Explain Query</h1>
            <p className="text-sm text-muted-foreground">
              <Link
                href="https://clickhouse.com/docs/en/sql-reference/statements/explain"
                target="_blank"
              >
                https://clickhouse.com/docs/en/sql-reference/statements/explain
              </Link>
            </p>
          </div>
        </div>

        <Textarea
          name="query"
          placeholder="SELECT .. FROM ..."
          defaultValue={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex gap-2">
          <Button variant="outline">Explain</Button>
        </div>

        <div className="mt-4 flex flex-row items-center justify-between">
          <div>
            <h1 className="text-xl text-muted-foreground">Explain</h1>
          </div>
        </div>

        {state.error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="size-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {keys.length > 0 && (
          <Tabs defaultValue={keys[0]} className="">
            <TabsList>
              {keys.map((key) => (
                <TabsTrigger value={key} key={key}>
                  {key}
                </TabsTrigger>
              ))}
            </TabsList>

            {keys
              .filter(
                (key) => key !== 'error' && state[key as ExplainType].explain
              )
              .map((key) => (
                <TabsContent value={key} key={key}>
                  <pre className="p-4">{state[key as ExplainType].explain}</pre>
                  <div className="mt-4">
                    <DialogSQL sql={state[key as ExplainType].sql} />
                  </div>
                </TabsContent>
              ))}
          </Tabs>
        )}
      </div>
    </form>
  )
}
