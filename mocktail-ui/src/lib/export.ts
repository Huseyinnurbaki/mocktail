import type { Mock } from './mocks'

/** Downloads the given mocks as a JSON file in the import-compatible `{ Apis: [...] }` shape. */
export function downloadMocks(mocks: Mock[]) {
  const payload = {
    Apis: mocks.map((m) => {
      let response: unknown
      try {
        response = JSON.parse(m.body || '{}')
      } catch {
        response = m.body
      }
      const api: Record<string, unknown> = {
        Method: m.method,
        Endpoint: m.path,
        StatusCode: m.status,
        Delay: m.delayMs,
        Response: response,
      }
      if (Object.keys(m.randomize).length > 0) api.Randomize = m.randomize
      if (Object.keys(m.headers).length > 0) api.Headers = m.headers
      return api
    }),
  }

  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mocktail-export_${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}
