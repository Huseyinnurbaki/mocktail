import type { Draft, HeadersConfig, Method, Mock, RandomizeConfig } from './mocks'
import { errMessage } from './http'

/** Backend record shape from `GET /core/v1/apis` (see mocktail-api/core/core.go). */
interface ApiRecord {
  ID: number
  Endpoint: string
  Method: string
  Key: string
  StatusCode: number
  Delay: number
  Response: unknown
  Randomize?: RandomizeConfig | null
  Headers?: HeadersConfig | null
}

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

function toMethod(m: string): Method {
  const up = (m || '').toUpperCase()
  return (METHODS.find((x) => x === up) as Method) ?? 'GET'
}

function toMock(a: ApiRecord): Mock {
  // Backend normalizes endpoints without a leading slash ("api/v1/users");
  // restore it so display, grouping, and prefix filtering stay consistent.
  const path = a.Endpoint.startsWith('/') ? a.Endpoint : '/' + a.Endpoint
  return {
    id: a.ID,
    method: toMethod(a.Method),
    path,
    status: a.StatusCode || 200,
    delayMs: a.Delay || 0,
    body: JSON.stringify(a.Response ?? {}, null, 2),
    randomize: a.Randomize ?? {},
    headers: a.Headers ?? {},
  }
}

export async function fetchMocks(signal?: AbortSignal): Promise<Mock[]> {
  const res = await fetch('/core/v1/apis', { signal })
  if (!res.ok) throw new Error(`GET /core/v1/apis → ${res.status}`)
  const data = (await res.json()) as ApiRecord[]
  return Array.isArray(data) ? data.map(toMock) : []
}

interface SavePayload {
  Endpoint: string
  Method: string
  StatusCode: number
  Delay: number
  Response: unknown
  Randomize: RandomizeConfig | null
  Headers: HeadersConfig | null
}

export async function deleteMock(id: number): Promise<void> {
  const res = await fetch(`/core/v1/api/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await errMessage(res, `DELETE /core/v1/api/${id}`))
}

/** Runs a response object through a config server-side and returns the generated object. */
async function bakeOnce(response: unknown, cfg: RandomizeConfig): Promise<unknown> {
  const res = await fetch('/core/v1/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Response: response, Randomize: cfg }),
  })
  if (!res.ok) throw new Error(await errMessage(res, 'POST /core/v1/preview'))
  return res.json()
}

export interface ImportResult {
  imported: number
  skipped: number
  failed: number
}

export interface LogEntry {
  timestamp: string
  message: string
  type: string
  method?: string
  path?: string
  status?: number
  duration?: string
  responseBody?: string
  responseHeaders?: Record<string, string>
}

export async function fetchLogs(): Promise<LogEntry[]> {
  const res = await fetch('/core/v1/logs')
  if (!res.ok) throw new Error(`GET /core/v1/logs → ${res.status}`)
  const d = (await res.json()) as { logs?: LogEntry[] }
  return d.logs ?? []
}

export async function clearLogs(): Promise<void> {
  await fetch('/core/v1/logs', { method: 'DELETE' })
}

/** The port the backend actually bound to (for the status pill). */
export async function fetchHealth(): Promise<{ port?: number }> {
  const res = await fetch('/health')
  if (!res.ok) throw new Error(`GET /health → ${res.status}`)
  return (await res.json()) as { port?: number }
}

/** Imports mocks from an exported JSON array or a `{ "Apis": [...] }` object. */
export async function importMocks(text: string): Promise<ImportResult> {
  const parsed = JSON.parse(text)
  const body = Array.isArray(parsed) ? { Apis: parsed } : parsed
  const res = await fetch('/core/v1/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await errMessage(res, 'POST /core/v1/import'))
  const r = (await res.json()) as { imported?: number; skipped?: number; failed?: number }
  return { imported: r.imported ?? 0, skipped: r.skipped ?? 0, failed: r.failed ?? 0 }
}

/** Runs the response through the randomize config server-side for a live sample. */
export async function previewMock(body: string, config: RandomizeConfig): Promise<string> {
  const res = await fetch('/core/v1/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Response: JSON.parse(body.trim() || '{}'), Randomize: config }),
  })
  if (!res.ok) throw new Error(await errMessage(res, 'POST /core/v1/preview'))
  return JSON.stringify(await res.json(), null, 2)
}

export interface TestResult {
  status: number
  ms: number
  body: string
  headers: [string, string][]
}

/** Fire the actual mock endpoint and capture status, elapsed time, body, and response headers. */
export async function sendMock(method: string, path: string): Promise<TestResult> {
  const t0 = performance.now()
  const res = await fetch('/mocktail' + path, { method })
  const body = await res.text()
  const headers: [string, string][] = []
  res.headers.forEach((v, k) => headers.push([k, v]))
  return { status: res.status, ms: Math.round(performance.now() - t0), body, headers }
}

/** Saves a mock (POST if new, PUT if existing) and returns its id. */
/**
 * Persists a mock (POST if new, PUT if existing) and returns the saved record. The returned
 * mock reflects the server's stored state — notably, "once" fields are baked into the response,
 * so the caller can refresh its editor with the frozen values instead of the pre-bake template.
 */
export async function saveMock(d: Draft): Promise<Mock> {
  // Split fields: per-request stay as config; "once" fields are generated now and baked in.
  const perRequest: RandomizeConfig = {}
  const once: RandomizeConfig = {}
  for (const [path, spec] of Object.entries(d.randomize ?? {})) {
    const { once: isOnce, ...rest } = spec
    if (isOnce) once[path] = rest
    else perRequest[path] = rest
  }

  let response: unknown = JSON.parse(d.body.trim() || '{}')
  if (Object.keys(once).length > 0) response = await bakeOnce(response, once)

  // Drop blank header rows before saving.
  const headers: HeadersConfig = {}
  for (const [k, v] of Object.entries(d.headers ?? {})) {
    if (k.trim()) headers[k.trim()] = v
  }

  const payload: SavePayload = {
    Endpoint: d.path,
    Method: d.method,
    StatusCode: d.status,
    Delay: d.delayMs,
    Response: response,
    Randomize: Object.keys(perRequest).length > 0 ? perRequest : null,
    Headers: Object.keys(headers).length > 0 ? headers : null,
  }

  const isNew = d.id === null
  const url = isNew ? '/core/v1/api' : `/core/v1/api/${d.id}`
  const res = await fetch(url, {
    method: isNew ? 'POST' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await errMessage(res, `${isNew ? 'POST' : 'PUT'} ${url}`))
  return toMock((await res.json()) as ApiRecord)
}
