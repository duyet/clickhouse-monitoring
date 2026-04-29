export function getHistoryQuerySearchParams(
  searchParams: Pick<URLSearchParams, 'get'>,
  defaultParams: Record<string, unknown> | undefined
) {
  const params: Record<string, string> = {}

  Object.keys(defaultParams || {}).forEach((key) => {
    const value = searchParams.get(key)
    if (value !== null) {
      params[key] = value
    }
  })

  return params
}
