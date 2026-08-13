import type { Draft, HeadersConfig, Method, Mock, RandomizeConfig } from './mocks'

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

async function errMessage(res: Response, ctx: string): Promise<string> {
  try {
    // Core endpoints return {message}; the AI endpoints return {error}.
    const j = (await res.json()) as { message?: string; error?: string }
    const m = j?.message || j?.error
    return m ? `${ctx}: ${m}` : `${ctx} → ${res.status}`
  } catch {
    return `${ctx} → ${res.status}`
  }
}

// ---------------------------------------------------------------------------
// AI assistant — provider config, models, and streaming chat.
// The API key is a backend secret; these calls only ever move a masked hint around.
// ---------------------------------------------------------------------------

export interface AIConfig {
  configured: boolean
  source: 'env' | 'stored' | 'none'
  provider: string
  model: string
  keyHint?: string
}
export interface AIProvider {
  id: string
  name: string
}
export interface AIModel {
  id: string
  displayName: string
  recommended?: boolean
}
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function fetchAIConfig(): Promise<AIConfig> {
  const res = await fetch('/core/v1/ai/config')
  if (!res.ok) throw new Error(await errMessage(res, 'GET /core/v1/ai/config'))
  return (await res.json()) as AIConfig
}

export async function fetchAIProviders(): Promise<{ providers: AIProvider[]; active: string }> {
  const res = await fetch('/core/v1/ai/providers')
  if (!res.ok) throw new Error(await errMessage(res, 'GET /core/v1/ai/providers'))
  return (await res.json()) as { providers: AIProvider[]; active: string }
}

export async function fetchAIModels(): Promise<{ models: AIModel[]; source: string; reason?: string }> {
  const res = await fetch('/core/v1/ai/models')
  if (!res.ok) throw new Error(await errMessage(res, 'GET /core/v1/ai/models'))
  return (await res.json()) as { models: AIModel[]; source: string; reason?: string }
}

/** Sets key (validated server-side), model, and/or provider. Never sends the key back. */
export async function saveAIConfig(input: {
  apiKey?: string
  model?: string
  provider?: string
}): Promise<AIConfig> {
  const res = await fetch('/core/v1/ai/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await errMessage(res, 'POST /core/v1/ai/config'))
  return (await res.json()) as AIConfig
}

export async function deleteAIKey(): Promise<AIConfig> {
  const res = await fetch('/core/v1/ai/config', { method: 'DELETE' })
  if (!res.ok) throw new Error(await errMessage(res, 'DELETE /core/v1/ai/config'))
  return (await res.json()) as AIConfig
}

export interface ToolActivity {
  name: string
  note: string
}

/** Streams an agentic assistant reply over SSE: text deltas via onToken, tool activity via onTool. */
export async function streamChat(
  messages: ChatMessage[],
  opts: {
    model?: string
    signal?: AbortSignal
    onToken: (t: string) => void
    onTool?: (t: ToolActivity) => void
  },
): Promise<void> {
  const res = await fetch('/core/v1/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model: opts.model }),
    signal: opts.signal,
  })
  if (!res.ok || !res.body) throw new Error(await errMessage(res, 'POST /core/v1/ai/chat'))

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    // SSE frames are separated by a blank line.
    let sep: number
    while ((sep = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, sep)
      buf = buf.slice(sep + 2)
      if (handleSSEFrame(frame, opts)) {
        await reader.cancel()
        return
      }
    }
  }
}

/** Returns true when the stream should stop (done event). Throws on an error event. */
function handleSSEFrame(
  frame: string,
  opts: { onToken: (t: string) => void; onTool?: (t: ToolActivity) => void },
): boolean {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  const data = dataLines.join('\n')
  if (event === 'done') return true
  if (event === 'error') {
    let m = 'stream error'
    try {
      m = (JSON.parse(data) as { message?: string }).message || m
    } catch {
      /* keep default */
    }
    throw new Error(m)
  }
  if (event === 'tool') {
    try {
      const t = JSON.parse(data) as ToolActivity
      opts.onTool?.(t)
    } catch {
      /* ignore */
    }
    return false
  }
  try {
    const { text } = JSON.parse(data) as { text?: string }
    if (text) opts.onToken(text)
  } catch {
    /* ignore keep-alive / non-JSON frames */
  }
  return false
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
export async function saveMock(d: Draft): Promise<number> {
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
  const saved = (await res.json()) as { ID?: number }
  return saved.ID ?? d.id ?? 0
}
