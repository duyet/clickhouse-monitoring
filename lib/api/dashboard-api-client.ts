/**
 * Client-side dashboard API utilities
 * Provides functions for interacting with dashboard settings from the browser
 */

export type FormSchema = Record<string, string>

export async function updateSettingParams(data: FormSchema): Promise<Response> {
  const response = await fetch('/api/v1/dashboard/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ params: data }),
  })

  if (!response.ok) {
    throw new Error('Failed to update settings')
  }

  return response.json()
}
