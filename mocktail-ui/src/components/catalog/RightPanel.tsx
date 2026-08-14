import type { Mock } from '../../lib/mocks'
import type { TestResult } from '../../lib/api'
import type { SettingsTab } from '../SettingsModal'
import { Mark } from '../Mark'
import { PreviewContent } from './PreviewPane'
import { AssistantPanel } from './AssistantPanel'

export type RightTab = 'preview' | 'assistant'

/** Right panel of the catalog — tabs between the request preview and the assistant. */
export function RightPanel({
  mock,
  onEdit,
  onSend,
  result,
  busy,
  err,
  width,
  port,
  tab,
  setTab,
  onOpenSettings,
  onMocksChanged,
  configNonce,
}: {
  mock: Mock | null
  onEdit: (m: Mock) => void
  onSend: (m: Mock) => void
  result: TestResult | null
  busy: boolean
  err: string | null
  width: number
  port?: number
  tab: RightTab
  setTab: (t: RightTab) => void
  onOpenSettings: (t: SettingsTab) => void
  onMocksChanged: () => void
  configNonce: number
}) {
  const tabBtn = (id: RightTab, label: React.ReactNode) => (
    <button
      onClick={() => setTab(id)}
      className={`flex-1 border-b-2 py-2 text-[12.5px] ${
        tab === id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
      }`}
    >
      {label}
    </button>
  )

  return (
    <aside
      // The drag sets the width directly, floored at 260px and capped at 60vw so the catalog
      // list always keeps ≥40vw. Persisted, so a dragged width sticks across sessions. Hidden < md.
      style={{ width: `clamp(260px, ${width}px, 55vw)` }}
      className="hidden shrink-0 flex-col overflow-hidden border-l border-border md:flex"
    >
      <div className="flex shrink-0 border-b border-border">
        {tabBtn('preview', 'Preview')}
        {tabBtn(
          'assistant',
          <span className="inline-flex items-center gap-1.5">
            <Mark className="h-[13px] w-[13px] text-accent" /> Assistant
          </span>,
        )}
      </div>
      {/* Both stay mounted (toggled with `hidden`) so an in-progress chat survives tab switches. */}
      <div className={tab === 'preview' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
        <PreviewContent mock={mock} onEdit={onEdit} onSend={onSend} result={result} busy={busy} err={err} port={port} />
      </div>
      <div className={tab === 'assistant' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
        <AssistantPanel
          onOpenSettings={onOpenSettings}
          onMocksChanged={onMocksChanged}
          active={tab === 'assistant'}
          selectedMock={mock}
          configNonce={configNonce}
        />
      </div>
    </aside>
  )
}
