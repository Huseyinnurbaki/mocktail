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
  tab,
  setTab,
  onOpenSettings,
}: {
  mock: Mock | null
  onEdit: (m: Mock) => void
  onSend: (m: Mock) => void
  result: TestResult | null
  busy: boolean
  err: string | null
  width: number
  tab: RightTab
  setTab: (t: RightTab) => void
  onOpenSettings: (t: SettingsTab) => void
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
      style={{ width }}
      className="hidden shrink-0 flex-col overflow-hidden border-l border-border xl:flex"
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
      {tab === 'preview' ? (
        <PreviewContent mock={mock} onEdit={onEdit} onSend={onSend} result={result} busy={busy} err={err} />
      ) : (
        <AssistantPanel onOpenSettings={onOpenSettings} />
      )}
    </aside>
  )
}
