import { useState } from 'react'
import type { SettingsTab } from '../SettingsModal'

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do response delays work?',
    a: 'Each mock can wait 0–30000ms before responding, to simulate latency. Set it with the Delay slider in the editor’s request bar.',
  },
  {
    q: 'How does randomize work?',
    a: 'Open a mock, click a field in the JSON body, then use the Data tab to pick a generator (uuid, email, number…). Values regenerate on every request unless you turn that off (frozen at save).',
  },
  {
    q: 'How do I set a custom status code?',
    a: 'In the editor’s request bar use the Status dropdown — pick a common code or type any value.',
  },
  {
    q: 'How do I run, duplicate, or delete a mock?',
    a: 'Right-click a row for Open / Run / Copy path / Duplicate / Delete. Or use the keyboard: ⌘↵ run · ⌘D duplicate · ⌘E new · ↵ open · ↑↓ navigate.',
  },
  {
    q: 'How do I import mocks?',
    a: 'Settings → Import: paste an exported JSON array (or { "Apis": [...] }) or choose a file. Existing paths are skipped.',
  },
  {
    q: 'How do I protect my mocks with a key?',
    a: 'Set the MOCKTAIL_API_KEY env var; then requests to /mocktail/* must include an X-API-Key header.',
  },
  {
    q: 'What is the Live view?',
    a: 'The ◉ Live button (top bar) streams the real requests hitting your mocks — method, status, latency, and response — newest first.',
  },
]

/** Pre-baked FAQ (works offline). Free-form chat is gated behind an API key. */
export function AssistantPanel({ onOpenSettings }: { onOpenSettings: (tab: SettingsTab) => void }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="mb-2 text-[12.5px] text-muted">Ask how Mocktail works — pick a question.</div>
        <div className="flex flex-col gap-1">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-[8px] border border-border">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px]"
              >
                <span>{f.q}</span>
                <span className="shrink-0 text-muted">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="border-t border-border-subtle px-3 py-2 text-[12.5px] leading-[1.6] text-muted">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Free-form chat — gated behind an API key until the AI provider is wired. */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-[9px] border border-dashed border-border px-3 py-2 opacity-80">
          <input
            disabled
            placeholder="Ask anything…"
            className="flex-1 cursor-not-allowed bg-transparent text-[13px] outline-none placeholder:text-muted"
          />
          <span className="text-[9px] uppercase tracking-wide text-param">soon</span>
        </div>
        <button
          onClick={() => onOpenSettings('apikeys')}
          className="mt-1 text-[11px] text-accent-text hover:underline"
        >
          Add an API key to chat freely →
        </button>
      </div>
    </div>
  )
}
