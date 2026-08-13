import { useState } from 'react'
import { FAQ } from '../lib/faq'

/** Grouped, collapsible help content (used in Settings → Help). */
export function FaqAccordion() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-3">
      {FAQ.map((section) => (
        <div key={section.group}>
          <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            {section.group}
          </div>
          <div className="flex flex-col gap-1">
            {section.items.map((f) => (
              <div key={f.q} className="rounded-[8px] border border-border">
                <button
                  onClick={() => setOpen(open === f.q ? null : f.q)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px]"
                >
                  <span>{f.q}</span>
                  <span className="shrink-0 text-muted">{open === f.q ? '−' : '+'}</span>
                </button>
                {open === f.q && (
                  <div className="border-t border-border-subtle px-3 py-2 text-[12.5px] leading-[1.6] text-muted">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
