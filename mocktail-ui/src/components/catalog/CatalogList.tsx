import type { MouseEvent } from 'react'
import type { Mock } from '../../lib/mocks'
import { CatalogRow } from './CatalogRow'
import { Mark } from '../Mark'

/** The scrollable list of mocks — handles loading / error / empty / rows. */
export function CatalogList({
  loading,
  error,
  rows,
  query,
  port,
  selectedId,
  onSelect,
  onOpen,
  onContext,
  onHelp,
}: {
  loading: boolean
  error: string | null
  rows: Mock[]
  query: string
  port?: number
  selectedId: number | null
  onSelect: (id: number) => void
  onOpen: (m: Mock) => void
  onContext: (e: MouseEvent, m: Mock) => void
  onHelp: () => void
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
        query.trim() ? (
          <div className="p-6 text-[13px] text-muted">No mocks match “{query.trim()}”.</div>
        ) : (
          <div className="mx-auto max-w-[480px] p-8 text-[13px] leading-[1.65] text-muted">
            <div className="mb-1 text-[15px] font-semibold text-fg">No mocks yet</div>
            <p className="mb-5">
              Mocktail runs fake HTTP endpoints for your apps. You pick the path and the response;
              they call it just like a real API.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg">
                  1 · Create one
                </div>
                Click <span className="font-mono text-fg">+ New mock</span> (top right) — or open the{' '}
                <span className="inline-flex items-center gap-1 align-baseline text-accent-text">
                  <Mark className="h-[12px] w-[12px]" /> Assistant
                </span>{' '}
                tab and describe it, e.g. “make a GET /users that returns 3 random users”.
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg">
                  2 · Call it
                </div>
                Each mock’s URL is your server address <span className="text-fg">+</span>{' '}
                <span className="font-mono text-fg">/mocktail</span> <span className="text-fg">+</span>{' '}
                the path you gave it. So <span className="font-mono text-fg">GET /api/users</span>{' '}
                becomes:
                <div className="mt-1.5 overflow-x-auto rounded-[7px] border border-border bg-surface-sunken px-2.5 py-1.5 font-mono text-[12px]">
                  <span className="text-muted">http://localhost:{port ?? 6625}</span>
                  <span className="text-accent-text">/mocktail</span>
                  <span className="text-fg">/api/users</span>
                </div>
              </div>
            </div>
            <p className="mt-5 border-t border-border pt-4">
              New to Mocktail?{' '}
              <button onClick={onHelp} className="text-accent-text transition-colors hover:text-accent">
                Read the quick help →
              </button>
            </p>
          </div>
        )
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
