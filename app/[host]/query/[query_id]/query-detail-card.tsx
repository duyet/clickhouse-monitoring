import {
  ExternalLinkIcon,
  FilterIcon,
  InfoIcon,
  MoveRightIcon,
} from 'lucide-react'
import Link from 'next/link'

import { ErrorAlert } from '@/components/error-alert'
import { TruncatedList } from '@/components/truncated-list'
import { TruncatedParagraph } from '@/components/truncated-paragraph'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { fetchData } from '@/lib/clickhouse-helpers'
import {
  formatErrorMessage,
  formatErrorTitle,
  getErrorDocumentation,
} from '@/lib/error-utils'
import { formatQuery } from '@/lib/format-readable'
import { getScopedLink } from '@/lib/scoped-link'
import { dedent } from '@/lib/utils'
import { QueryConfig } from '@/types/query-config'

import { type RowData } from './config'
import { PageProps } from './types'

export async function QueryDetailCard({
  queryConfig,
  params,
}: {
  queryConfig: QueryConfig
  params: Awaited<PageProps['params']>
  searchParams: Awaited<PageProps['searchParams']>
}) {
  const queryParams = {
    ...queryConfig.defaultParams,
    ...params,
  }
  const { data, error } = await fetchData<RowData[]>({
    query: queryConfig.sql,
    format: 'JSONEachRow',
    query_params: queryParams,
    clickhouse_settings: {
      use_query_cache: 0,
      ...queryConfig.clickhouseSettings,
    },
  })

  if (error) {
    return (
      <ErrorAlert
        title={formatErrorTitle(error)}
        message={formatErrorMessage(error)}
        docs={getErrorDocumentation(error) || queryConfig.docs}
        query={queryConfig.sql}
      />
    )
  }

  if (!data?.length) {
    return <div className="text-muted-foreground">No data</div>
  }

  const { query } = data[0]

  // Details
  const {
    hostname,
    client_hostname,
    client_name,
    client_revision,
    initial_user,
    initial_query_id,
    initial_address,
    initial_port,
    initial_query_start_time,
    databases,
    tables,
    columns,
    partitions,
    projections,
    views,
    exception_code,
    exception,
    interface_query_initial_from,
    stack_trace,
    http_method,
    http_user_agent,
    http_referer,
    forwarded_for,
    quota_key,
    distributed_depth,
    revision,
    log_comment,
    ProfileEvents,
    Settings,
    used_aggregate_functions,
    used_aggregate_function_combinators,
    used_database_engines,
    used_data_type_families,
    used_dictionaries,
    used_formats,
    used_functions,
    used_storages,
    used_table_functions,
    used_row_policies,
    used_privileges,
    missing_privileges,
  } = data.find((row) => row.type == 'QueryFinish') || data[0]

  return (
    <div>
      <div className="my-3">
        <Accordion
          type="single"
          collapsible
          className="w-full rounded-lg bg-gray-100"
        >
          <AccordionItem value="query" className="border-none">
            <AccordionTrigger className="w-full items-start justify-start p-3 hover:no-underline">
              <div className="w-full truncate text-left">
                <code className="truncate">
                  {formatQuery({
                    query,
                    comment_remove: true,
                    trim: true,
                    truncate: 100,
                  })}
                </code>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-3">
              <pre>{dedent(formatQuery({ query, trim: false }))}</pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {(
          [
            ['Hostname of the server executing the query', hostname],
            ['Client host name', client_hostname],
            ['Client name', client_name],
            ['Client revision', client_revision],
            [
              'Initial user (for distributed query execution)',
              initial_user ? (
                <Link
                  className="flex flex-row items-center gap-1"
                  href={await getScopedLink(
                    `/history-queries?user=${initial_user}`
                  )}
                  target="_blank"
                  key="initial_user"
                >
                  {initial_user}
                  <FilterIcon className="size-3" />
                </Link>
              ) : (
                ''
              ),
            ],
            [
              'Initial query id (for distributed query execution)',
              <Link
                className="flex flex-row items-center gap-1"
                href={await getScopedLink(`/query/${initial_query_id}`)}
                target="_blank"
                key="initial_query_id"
              >
                {initial_query_id}
                <FilterIcon className="size-3" />
              </Link>,
            ],
            [
              'initial_address (IP address that the parent query was launched from)',
              initial_address,
            ],
            [
              'initial_port (The client port that was used to make the parent query)',
              initial_port,
            ],
            [
              'Initial query starting time (for distributed query execution)',
              initial_query_start_time,
            ],
            ['Databases', bindingDatabaseLink(databases)],
            ['Tables', bindingTableLink(tables)],
            ['Columns', JSON.stringify(columns, null, 2)],
            ['Partitions', JSON.stringify(partitions, null, 2)],
            ['Projections', JSON.stringify(projections, null, 2)],
            ['Views', JSON.stringify(views, null, 2)],
            ['Exception code', exception_code],
            ['Exception', exception],
            ['Stack trace', stack_trace],
            [
              'Interface that the query was initiated from (1 — TCP, 2 — HTTP)',
              interface_query_initial_from,
            ],
            ['HTTP method (0 = TCP, 1 = GET, 2 = POST)', http_method],
            ['HTTP user agent', http_user_agent],
            ['HTTP referer', http_referer],
            ['Forwarded for', forwarded_for],
            ['Quota key', quota_key],
            ['Distributed depth', distributed_depth],
            ['Revision', revision],
            ['Log Comment', log_comment],
            [
              {
                key: 'Profile events',
                link: 'https://clickhouse.com/docs/en/operations/system-tables/metrics',
              },
              JSON.stringify(ProfileEvents, null, 2),
            ],
            [
              {
                key: 'Settings',
                link: 'https://clickhouse.com/docs/en/operations/server-configuration-parameters/settings',
              },
              JSON.stringify(Settings, null, 2),
            ],
            [
              'Used aggregate functions',
              bindingReference(used_aggregate_functions),
            ],
            [
              'Used aggregate function combinators',
              JSON.stringify(used_aggregate_function_combinators, null, 2),
            ],
            [
              {
                key: 'Used database engines',
                link: 'https://clickhouse.com/docs/en/chdb/data-formats',
              },
              JSON.stringify(used_database_engines, null, 2),
            ],
            [
              'Used data type families',
              JSON.stringify(used_data_type_families, null, 2),
            ],
            ['Used dictionaries', JSON.stringify(used_dictionaries, null, 2)],
            ['Used formats', bindingDataFormat(used_formats)],
            ['Used functions', bindingReference(used_functions)],
            ['Used storages', JSON.stringify(used_storages, null, 2)],
            [
              'Used table functions',
              JSON.stringify(used_table_functions, null, 2),
            ],
            ['Used row policies', JSON.stringify(used_row_policies, null, 2)],
            ['Used privileges', JSON.stringify(used_privileges, null, 2)],
            ['Missing privileges', JSON.stringify(missing_privileges, null, 2)],
          ] as Array<
            | [string, string | React.ReactNode[]]
            | [{ key: string; link: string }, string | React.ReactNode[]]
          >
        )
          .filter(
            ([_, value]) =>
              (Array.isArray(value) && value.length) ||
              (!!value && value !== '[]' && value !== '{}')
          )
          .map(([key, value]) => (
            <div
              className="hover:bg-accent hover:text-accent-foreground mt-2 flex items-start space-x-4 rounded-md p-2 transition-all"
              key={typeof key === 'string' ? key : key.key}
            >
              <div className="space-y-1">
                <p className="text-sm leading-none font-medium">
                  {typeof key === 'string' ? (
                    key
                  ) : (
                    <Link
                      href={key.link}
                      target="_blank"
                      className="flex gap-1"
                    >
                      {key.key} <ExternalLinkIcon className="size-3" />
                    </Link>
                  )}
                </p>
                {typeof value === 'string' ? (
                  <TruncatedParagraph className="text-muted-foreground text-sm">
                    {value}
                  </TruncatedParagraph>
                ) : (
                  <div className="text-muted-foreground flex flex-col flex-wrap gap-1 text-sm">
                    <TruncatedList>{value}</TruncatedList>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      <div className="text-muted-foreground mt-4 inline-flex items-center gap-1 rounded border p-3 text-sm">
        <InfoIcon className="size-4" />
        See the detailed explanation at the{' '}
        <Link
          href="https://clickhouse.com/docs/en/operations/system-tables/query_log"
          className="inline-flex items-center gap-1"
        >
          system.query_log document <ExternalLinkIcon className="size-3" />
        </Link>
      </div>
    </div>
  )
}

function bindingDatabaseLink(
  databases: Array<string>
): React.ReactNode[] | null {
  if (!databases.length) {
    return null
  }

  return databases.map(async (database) => {
    if (database.startsWith('_table_function')) {
      return database
    }

    return (
      <Link
        className="flex flex-row items-center gap-1"
        key={database}
        href={await getScopedLink(`/database/${database}`)}
      >
        {database} <MoveRightIcon className="size-3" />
      </Link>
    )
  })
}

function bindingTableLink(tables: Array<string>): React.ReactNode[] | null {
  if (!tables.length) {
    return null
  }

  return tables.map(async (databaseTable) => {
    const [database, table] = databaseTable.split('.')

    // Link to ClickHouse docs
    if (database.startsWith('_table_function')) {
      return (
        <Link
          className="flex flex-row items-center gap-1"
          key={databaseTable}
          href={`https://clickhouse.com/docs/en/sql-reference/table-functions/${table}`}
          title="Open ClickHouse Docs"
        >
          {databaseTable} <ExternalLinkIcon className="size-3" />
        </Link>
      )
    }

    return (
      <Link
        className="flex flex-row items-center gap-1"
        key={databaseTable}
        href={await getScopedLink(`/database/${database}/${table}`)}
        title="Open Database Table Detail"
      >
        {databaseTable} <MoveRightIcon className="size-3" />
      </Link>
    )
  })
}

function bindingReference(value: Array<string>): React.ReactNode[] | null {
  if (!value.length) {
    return null
  }

  const getSearchLink = (item: string) => {
    const searchParams = new URLSearchParams({
      q: `repo:ClickHouse/ClickHouse path:docs/en/sql-reference path:*.md "# ${item}"`,
    })
    let url = new URL(`https://github.com/search`)
    url.search = searchParams.toString()

    return url.toString()
  }

  return value.map((item) => {
    return (
      <Link
        className="flex flex-row items-center gap-1"
        key={item}
        href={getSearchLink(item)}
        target="_blank"
      >
        {item} <ExternalLinkIcon className="size-3" />
      </Link>
    )
  })
}

function bindingDataFormat(value: Array<string>): React.ReactNode[] | null {
  if (!value.length) {
    return null
  }

  return value.map((item) => {
    return (
      <Link
        className="flex flex-row items-center gap-1"
        key={item}
        href="https://clickhouse.com/docs/en/chdb/data-formats"
        target="_blank"
      >
        {item} <ExternalLinkIcon className="size-3" />
      </Link>
    )
  })
}
