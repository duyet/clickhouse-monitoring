'use client'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

import { DialogSQL } from '@/components/dialog-sql'
import Link from 'next/link'
import { useFormState } from 'react-dom'
import { explainAction, type Explains, type ExplainType } from './actions'

const initialState: Explains = {
  PLAN: { explain: '', sql: '' },
  ESTIMATE: { explain: '', sql: '' },
  PIPELINE: { explain: '', sql: '' },
  SYNTAX: { explain: '', sql: '' },
  'QUERY TREE': { explain: '', sql: '' },
  AST: { explain: '', sql: '' },
}

export default function ExplainPage() {
  const [state, formAction] = useFormState(explainAction, initialState)

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
          defaultValue={'SELECT * FROM numbers(100)'}
        />

        <div className="flex gap-2">
          <Button variant="outline">Explain</Button>
        </div>

        <div className="mt-4 flex flex-row items-center justify-between">
          <div>
            <h1 className="text-xl text-muted-foreground">Explain</h1>
          </div>
        </div>

        <Tabs defaultValue={Object.keys(state)[0]} className="">
          <TabsList>
            {Object.keys(state).map((key) => (
              <TabsTrigger value={key} key={key}>
                {key}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(state).map((key) => (
            <TabsContent value={key} key={key}>
              <pre className="p-4">{state[key as ExplainType].explain}</pre>
              <div className="mt-4">
                <DialogSQL sql={state[key as ExplainType].sql} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </form>
  )
}
