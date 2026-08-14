// AI assistant client — provider config, models, and streaming chat.
// The API key is a backend secret; these calls only ever move a masked hint around.
import { errMessage } from './http'

export interface AIConfig {
  configured: boolean
  source: 'env' | 'stored' | 'none'
  provider: string
  model: string
  keyHint?: string
  // False when the key can't be set from this session (remote/containerized dashboard) — the
  // UI then points at the MOCKTAIL_AI_API_KEY_<PROVIDER> env var instead of showing an input that 403s.
  editable: boolean
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
export interface ToolActivity {
  name: string
  note: string
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
