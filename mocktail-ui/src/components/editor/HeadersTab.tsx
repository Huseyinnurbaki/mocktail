import { useState } from 'react'
import type { HeadersConfig } from '../../lib/mocks'

interface Row {
  key: string
  value: string
}

const COMMON = [
  'Content-Type',
  'Cache-Control',
  'Location',
  'X-Total-Count',
  'Set-Cookie',
  'Retry-After',
  'ETag',
  'Link',
]

function toRows(h: HeadersConfig): Row[] {
  return Object.entries(h ?? {}).map(([key, value]) => ({ key, value }))
}

function toObject(rows: Row[]): HeadersConfig {
  const out: HeadersConfig = {}
  for (const r of rows) {
    const k = r.key.trim()
    if (k) out[k] = r.value
  }
  return out
}

/** Add/remove key-value editor for a mock's custom response headers. */
export function HeadersTab({
  headers,
  setHeaders,
}: {
  headers: HeadersConfig
  setHeaders: (h: HeadersConfig) => void
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(headers))

  function update(next: Row[]) {
    setRows(next)
    setHeaders(toObject(next))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[8px] border border-border-subtle bg-surface-sunken px-3 py-2 text-[11.5px] leading-[1.55] text-muted">
        Custom response headers sent with this mock. Setting <span className="font-mono text-fg">Content-Type</span>{' '}
        here overrides the default <span className="font-mono">application/json</span>.
      </div>

      {rows.length === 0 && <div className="text-[12.5px] text-muted">No headers yet.</div>}

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={r.key}
              onChange={(e) => update(rows.map((row, idx) => (idx === i ? { ...row, key: e.target.value } : row)))}
              placeholder="Header"
              list="mocktail-common-headers"
              className="min-w-0 flex-1 rounded-[6px] border border-border bg-surface px-2 py-[5px] font-mono text-[12px] outline-none focus:border-accent"
            />
            <input
              value={r.value}
              onChange={(e) => update(rows.map((row, idx) => (idx === i ? { ...row, value: e.target.value } : row)))}
              placeholder="value"
              className="min-w-0 flex-1 rounded-[6px] border border-border bg-surface px-2 py-[5px] font-mono text-[12px] outline-none focus:border-accent"
            />
            <button
              onClick={() => update(rows.filter((_, idx) => idx !== i))}
              aria-label="Remove header"
              className="shrink-0 rounded-[6px] px-2 py-[5px] text-muted hover:bg-surface-sunken hover:text-error"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <datalist id="mocktail-common-headers">
        {COMMON.map((h) => (
          <option key={h} value={h} />
        ))}
      </datalist>

      <button
        onClick={() => update([...rows, { key: '', value: '' }])}
        className="self-start rounded-[7px] border border-border px-3 py-[6px] text-[12.5px] hover:bg-surface-sunken"
      >
        + Add header
      </button>
    </div>
  )
}
