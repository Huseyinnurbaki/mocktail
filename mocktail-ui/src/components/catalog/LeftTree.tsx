import { useMemo } from 'react'
import { buildTree, type Mock } from '../../lib/mocks'
import type { SettingsTab } from '../SettingsModal'

export function LeftTree({
  mocks,
  selectedKey,
  onSelect,
  collapsed,
  onToggle,
  onOpenSettings,
}: {
  mocks: Mock[]
  selectedKey: string | null
  onSelect: (k: string | null) => void
  collapsed: Set<string>
  onToggle: (k: string) => void
  onOpenSettings: (tab: SettingsTab) => void
}) {
  const tree = useMemo(() => buildTree(mocks), [mocks])
  const row = 'flex w-full items-center justify-between rounded-[7px] px-2 py-[6px]'
  const sel = (active: boolean) => (active ? 'bg-accent-tint text-accent-text' : 'hover:bg-surface')

  return (
    <nav className="hidden w-[236px] shrink-0 flex-col border-r border-border bg-surface-sunken lg:flex">
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto p-2">
        <button onClick={() => onSelect(null)} className={`${row} text-[13px] ${sel(selectedKey === null)}`}>
          <span>All mocks</span>
          <span className="text-muted">{mocks.length}</span>
        </button>

        <div className="mt-2 px-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">
          Grouped by base path
        </div>

        {tree.map((base) => {
          const open = !collapsed.has(base.key)
          const hasChildren = base.resources.length > 0
          return (
            <div key={base.key}>
              <button
                onClick={() => {
                  onSelect(base.key)
                  if (hasChildren) onToggle(base.key)
                }}
                className={`${row} font-mono text-[12.5px] ${sel(selectedKey === base.key)}`}
              >
                <span>
                  <span className="text-muted">{hasChildren ? (open ? '▾ ' : '▸ ') : '  '}</span>
                  {base.label}
                </span>
                <span className="text-muted">{base.count}</span>
              </button>

              {open && hasChildren && (
                <div className="ml-[15px] mt-1 flex flex-col gap-1 border-l border-border-subtle pl-2">
                  {base.resources.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => onSelect(r.key)}
                      className={`${row} font-mono text-[12px] ${sel(selectedKey === r.key)}`}
                    >
                      <span className="truncate">{r.label}</span>
                      <span className="text-muted">{r.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-border p-2">
        <button
          onClick={() => onOpenSettings('theme')}
          className="flex w-full items-center gap-1.5 rounded-[7px] px-2 py-[7px] text-[13px] hover:bg-border-subtle"
        >
          <span className="text-[14px]">⚙</span> Settings
        </button>
      </div>
    </nav>
  )
}
