export function getHistoryQuerySearchParams(
  searchParams: Pick<URLSearchParams, 'get'>,
  defaultParams: Record<string, string | number | boolean> | undefined
): Record<string, string> {
  const params: Record<string, string> = {}

  if (!defaultParams) {
    return params
  }

  Object.keys(defaultParams).forEach((key) => {
    const value = searchParams.get(key)
    if (value !== null && value !== '') {
      params[key] = value
    }
  })

  return params
}
