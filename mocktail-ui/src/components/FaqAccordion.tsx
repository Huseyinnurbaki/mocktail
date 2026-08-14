import { useState } from 'react'
import { FAQ, FAQ_INTRO } from '../lib/faq'
import { Mark } from './Mark'

/** Grouped, collapsible help content (used in Settings → Help). */
export function FaqAccordion() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5 px-1">
        <p className="text-[13px] leading-[1.6] text-fg">{FAQ_INTRO.lead}</p>
        <div className="flex flex-wrap gap-1.5">
          {FAQ_INTRO.features.map((f) => (
            <span
              key={f}
              className="rounded-full border border-border bg-surface-sunken px-2 py-0.5 text-[11px] text-muted"
            >
              {f}
            </span>
          ))}
        </div>
        <div className="flex items-start gap-2 rounded-[8px] border border-accent/30 bg-accent/5 px-3 py-2 text-[12.5px] leading-[1.55] text-muted">
          <Mark className="mt-0.5 h-[13px] w-[13px] shrink-0 text-accent" />
          <span>{FAQ_INTRO.assistant}</span>
        </div>
      </div>
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

      <div className="mt-1 rounded-[8px] border border-border bg-surface-sunken px-3 py-3">
        <div className="mb-0.5 text-[13px] font-semibold text-fg">Suggestions & bug reports</div>
        <p className="text-[12.5px] leading-[1.55] text-muted">
          Hit a bug or have an idea? Open an issue on GitHub — feedback shapes what ships next.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://github.com/Huseyinnurbaki/mocktail/issues/new"
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-[7px] border border-accent/40 bg-accent/5 px-2.5 py-1 text-[12px] text-accent-text transition-colors hover:bg-accent/10"
          >
            Report an issue →
          </a>
          <a
            href="https://github.com/Huseyinnurbaki/mocktail"
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-[7px] border border-border px-2.5 py-1 text-[12px] text-muted transition-colors hover:text-fg"
          >
            Star on GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
