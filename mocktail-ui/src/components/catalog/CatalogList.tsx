import type { MouseEvent } from 'react'
import type { Mock } from '../../lib/mocks'
import { CatalogRow } from './CatalogRow'

/** The scrollable list of mocks — handles loading / error / empty / rows. */
export function CatalogList({
  loading,
  error,
  rows,
  query,
  selectedId,
  onSelect,
  onOpen,
  onContext,
}: {
  loading: boolean
  error: string | null
  rows: Mock[]
  query: string
  selectedId: number | null
  onSelect: (id: number) => void
  onOpen: (m: Mock) => void
  onContext: (e: MouseEvent, m: Mock) => void
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      {loading ? (
        <div className="p-6 text-[13px] text-muted">Loading mocks…</div>
      ) : error ? (
        <div className="m-4 rounded-[9px] border border-error/40 bg-del-bg px-4 py-3 text-[13px] text-del-fg">
          Couldn’t reach the backend at <span className="font-mono">/core/v1/apis</span> — {error}.
          <br />
          Is it running? <span className="font-mono">cd mocktail-api &amp;&amp; make dev-api</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-[13px] text-muted">
          {query.trim() ? (
            <>No mocks match “{query.trim()}”.</>
          ) : (
            <>
              No mocks yet. Create one with <span className="font-mono">+ New mock</span>.
            </>
          )}
        </div>
      ) : (
        rows.map((m) => (
          <CatalogRow
            key={m.id}
            mock={m}
            selected={m.id === selectedId}
            onSelect={() => onSelect(m.id)}
            onOpen={() => onOpen(m)}
            onContextMenu={(e) => onContext(e, m)}
          />
        ))
      )}
    </div>
  )
}
