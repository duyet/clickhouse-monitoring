'use client'

import { mutate } from 'swr'

export async function revalidateAllData() {
  await mutate(() => true, undefined, { revalidate: true })
}

export async function revalidateCharts() {
  await mutate(
    (key) => typeof key === 'string' && key.startsWith('/api/v1/charts'),
    undefined,
    { revalidate: true }
  )
}

export async function revalidateTables() {
  await mutate(
    (key) => typeof key === 'string' && key.startsWith('/api/v1/tables'),
    undefined,
    { revalidate: true }
  )
}

export async function revalidateByPattern(pattern: string) {
  await mutate(
    (key) => typeof key === 'string' && key.includes(pattern),
    undefined,
    { revalidate: true }
  )
}
