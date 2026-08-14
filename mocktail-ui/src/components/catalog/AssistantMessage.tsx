import type { ReactNode } from 'react'
import { METHOD_BADGE } from '../../lib/methods'
import type { Method } from '../../lib/mocks'

// Lightweight renderer for assistant replies: fenced code blocks get JSON syntax coloring,
// and inline HTTP methods / paths / JSON snippets are highlighted in the app's own colors.
// Deliberately small (no markdown lib) — the assistant output is short and structured.

export function AssistantMessage({ text }: { text: string }) {
  return <div className="whitespace-pre-wrap text-[13px] leading-[1.55]">{renderBlocks(text)}</div>
}

/** Split into fenced ```code``` blocks and prose. */
function renderBlocks(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const fence = /```(\w+)?\n?([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = fence.exec(text))) {
    const before = text.slice(last, m.index).replace(/\n+$/, '')
    if (before) out.push(<Prose key={i++} text={before} />)
    out.push(<CodeBlock key={i++} code={m[2].replace(/\n$/, '')} />)
    last = fence.lastIndex
  }
  const rest = text.slice(last).replace(/^\n+/, '')
  if (rest) out.push(<Prose key={i++} text={rest} />)
  return out
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="my-1 overflow-x-auto rounded-[8px] border border-border bg-surface-sunken p-2 text-[12px] leading-[1.5]">
      <code className="font-mono">{isJSON(code) ? highlightJSON(code) : code}</code>
    </pre>
  )
}

/** Prose with inline highlighting for `code`, methods, paths, and inline JSON. */
function Prose({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`') ? (
          <code key={i} className="rounded-[4px] bg-surface-sunken px-1 font-mono text-[12px]">
            {highlightInner(p.slice(1, -1))}
          </code>
        ) : (
          <span key={i}>{renderInline(p)}</span>
        ),
      )}
    </span>
  )
}

// Matches: an HTTP method (optionally followed by a path) · inline JSON · or a bare /path token
// (so paths in prose like "Deleted /api/v1/users-copy" get styled too, not just METHOD /path).
const METHOD_RE = /(GET|POST|PUT|PATCH|DELETE)(\s+(\/[^\s,.;:]*))?|(\{[^{}]*\}|\[[^\[\]]*\])|(?<!\w)(\/[\w-]+(?:\/[\w-]+)*)/g

/** Color inline `METHOD /path` and short inline JSON objects. */
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = METHOD_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) {
      out.push(<MethodChip key={i++} method={m[1]} />)
      if (m[2]) out.push(<span key={i++} className="font-mono text-[12px] text-accent-text">{m[2]}</span>)
    } else if (m[4]) {
      out.push(
        isJSON(m[4]) ? (
          <code key={i++} className="rounded-[4px] bg-surface-sunken px-1 font-mono text-[12px]">
            {highlightJSON(m[4])}
          </code>
        ) : (
          m[4]
        ),
      )
    } else if (m[5]) {
      out.push(
        <span key={i++} className="font-mono text-[12px] text-accent-text">
          {m[5]}
        </span>,
      )
    }
    last = METHOD_RE.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** Highlight the innards of an inline `code` span (path or JSON). */
function highlightInner(code: string): ReactNode {
  if (isJSON(code)) return highlightJSON(code)
  return code
}

function MethodChip({ method }: { method: string }) {
  const cls = METHOD_BADGE[method as Method] ?? 'bg-surface-sunken text-muted'
  return (
    <span className={`rounded-[4px] px-[5px] py-[1px] font-mono text-[11px] font-semibold ${cls}`}>
      {method}
    </span>
  )
}

function isJSON(s: string): boolean {
  const t = s.trim()
  if (!(t.startsWith('{') || t.startsWith('['))) return false
  try {
    JSON.parse(t)
    return true
  } catch {
    return false
  }
}

const JSON_RE = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false|null)|([{}[\],:])/g

/** Minimal JSON token coloring — keys, strings, numbers, literals, punctuation. */
function highlightJSON(src: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = JSON_RE.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index))
    const cls = m[1]
      ? 'text-accent-text' // key
      : m[2]
        ? 'text-success' // string
        : m[3]
          ? 'text-post-fg' // number
          : m[4]
            ? 'text-put-fg' // true/false/null
            : 'text-muted' // punctuation
    out.push(
      <span key={i++} className={cls}>
        {m[0]}
      </span>,
    )
    last = JSON_RE.lastIndex
  }
  if (last < src.length) out.push(src.slice(last))
  return out
}
