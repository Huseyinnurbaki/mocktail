import { useEffect, useState } from 'react'
import type { Mock } from '../lib/mocks'
import { fetchAIConfig, streamChat, type AIConfig, type ChatMessage } from '../lib/ai'
import { errText } from '../lib/err'

// `/this` in a message expands to the currently-selected endpoint, so "delete /this" or
// "update /this to …" targets it unambiguously (method + path + id for the tools).
const THIS_RE = /(^|\s)\/this\b/gi
function expandThis(text: string, mock: Mock | null): string {
  if (!mock) return text
  return text.replace(THIS_RE, (_m, pre) => `${pre}${mock.method} ${mock.path} (#${mock.id})`)
}

// A chat item shows `content` but, for a user message, may carry `sent` — the resolved text
// actually sent to the model. e.g. "/this" is shown as typed but sends the expanded reference.
type ChatItem = { role: 'user' | 'assistant'; content: string; sent?: string }
// A tool-activity line is a UI-only item; it's not part of the chat history sent to the model.
type ToolItem = { role: 'tool'; note: string }
export type UIItem = ChatItem | ToolItem

/** Build the model-facing history from UI items: drop tool lines, merge consecutive same-role. */
function toHistory(items: UIItem[]): ChatMessage[] {
  const out: ChatMessage[] = []
  for (const it of items) {
    if (it.role === 'tool') continue
    const text = it.sent ?? it.content
    if (!text.trim()) continue
    const last = out[out.length - 1]
    if (last && last.role === it.role) last.content += '\n' + text
    else out.push({ role: it.role, content: text })
  }
  return out
}

/** Append a text delta to the trailing assistant bubble, or start a new one. */
function appendText(items: UIItem[], t: string): UIItem[] {
  const last = items[items.length - 1]
  if (last && last.role === 'assistant') {
    const copy = items.slice()
    copy[copy.length - 1] = { role: 'assistant', content: last.content + t }
    return copy
  }
  return [...items, { role: 'assistant', content: t }]
}

/**
 * The assistant's chat engine: config, transcript, streaming, and `/this` / `/clear` handling.
 * Presentation (empty state, transcript, composer) lives in the panel.
 */
export function useAssistantChat({
  active,
  configNonce,
  selectedMock,
  onMocksChanged,
}: {
  active: boolean
  configNonce: number
  selectedMock: Mock | null
  onMocksChanged: () => void
}) {
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [items, setItems] = useState<UIItem[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // The panel stays mounted (hidden) across tab switches, so re-check config when it becomes
  // active or when Settings closes (configNonce bumps) — either can change the stored key.
  useEffect(() => {
    if (!active) return
    let alive = true
    fetchAIConfig()
      .then((c) => alive && setConfig(c))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [active, configNonce])

  const clear = () => {
    setItems([])
    setErr(null)
  }

  async function send(raw?: string) {
    const text = (raw ?? input).trim()
    if (!text || streaming) return
    if (text === '/clear') {
      setInput('')
      clear()
      return
    }
    if (/(^|\s)\/this\b/i.test(text) && !selectedMock) {
      setErr('Select an endpoint in the list to use /this')
      return
    }
    setInput('')
    setErr(null)
    // Show the message as typed (with /this), but send the resolved reference to the model.
    const sent = expandThis(text, selectedMock)
    const history: ChatMessage[] = [...toHistory(items), { role: 'user', content: sent }]
    setItems((prev) => [...prev, { role: 'user', content: text, sent }])
    setStreaming(true)
    let mutated = false
    try {
      await streamChat(history, {
        model: config?.model,
        onToken: (t) => setItems((prev) => appendText(prev, t)),
        onTool: (tool) => {
          setItems((prev) => [...prev, { role: 'tool', note: tool.note }])
          // list_mocks / get_mock only read; anything else changes the catalog.
          if (tool.name !== 'list_mocks' && tool.name !== 'get_mock') mutated = true
        },
      })
    } catch (e) {
      setErr(errText(e))
    } finally {
      setStreaming(false)
      // Refresh AFTER the turn finishes. Tool events arrive when a tool *starts* (before it runs on
      // the backend), so refreshing per-event races the DB write — one refresh at the end reflects
      // every tool's result correctly.
      if (mutated) onMocksChanged()
    }
  }

  return { config, items, input, setInput, streaming, err, send, clear }
}
