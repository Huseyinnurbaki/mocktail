import { useState } from 'react'
import type { FieldSpec, RandomizeConfig } from '../../lib/mocks'
import { countTargets } from '../../lib/json'
import { previewMock } from '../../lib/api'
import { ResponseView } from '../ResponseView'
import { Toggle } from '../Toggle'
import { GeneratorPicker } from './GeneratorPicker'

const NEEDS_RANGE = new Set(['number', 'float', 'price'])

/** Single-field inspector: configure the field clicked in the editor. */
export function DataTab({
  body,
  config,
  setConfig,
  selectedField,
}: {
  body: string
  config: RandomizeConfig
  setConfig: (c: RandomizeConfig) => void
  selectedField: string | null
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [previewErr, setPreviewErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  let parsed: unknown = null
  let parseError = false
  try {
    parsed = JSON.parse(body.trim() || '{}')
  } catch {
    parseError = true
  }

  if (parseError) {
    return (
      <div className="text-[12.5px] text-error">
        Fix the JSON in the editor to configure randomized fields.
      </div>
    )
  }

  const intro = (
    <div className="rounded-[8px] border border-border-subtle bg-surface-sunken px-3 py-2 text-[11.5px] leading-[1.55] text-muted">
      Click a field in the editor, then choose a generator to replace its value with realistic fake
      data — regenerated on every request, or frozen once. This doubles as{' '}
      <span className="font-medium text-fg">anonymization</span>: paste a real response and swap
      names, emails, IDs and the like for safe fakes.
    </div>
  )

  if (!selectedField) {
    return (
      <div className="flex flex-col gap-3">
        {intro}
        <div className="text-[12.5px] text-muted">
          No field selected yet — click one in the editor to configure it.
        </div>
      </div>
    )
  }

  const field = selectedField
  const segs = field.split('.')
  const indexLessSegs = segs.filter((s) => !/^\d+$/.test(s))
  const indexLess = indexLessSegs.join('.')
  const hasIndex = indexLess !== field
  const key = indexLessSegs[indexLessSegs.length - 1]
  const count = countTargets(parsed, indexLessSegs)
  // Scope: index-less key applies to all elements; the indexed key targets just this one.
  const scopeThis = !!config[field]
  const activeKey = scopeThis ? field : indexLess
  const spec = config[activeKey]

  function update(patch: Partial<FieldSpec> | null) {
    const next = { ...config }
    if (patch === null) delete next[activeKey]
    else next[activeKey] = { ...next[activeKey], ...patch }
    setConfig(next)
  }

  function setScopeAll(all: boolean) {
    const from = all ? field : indexLess
    const to = all ? indexLess : field
    if (from === to) return
    const next = { ...config }
    if (next[from]) {
      next[to] = next[from]
      delete next[from]
      setConfig(next)
    }
  }

  async function runPreview() {
    if (!spec) return
    setBusy(true)
    setPreviewErr(null)
    try {
      setPreview(await previewMock(body, { [activeKey]: spec }))
    } catch (e: unknown) {
      setPreviewErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {intro}
      <div>
        <div className="text-[11px] uppercase tracking-[0.06em] text-muted">Field</div>
        <div className="font-mono text-[13px]">{indexLess}</div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[12.5px] text-muted">Generator</span>
        <GeneratorPicker value={spec?.type} onChange={(v) => update(v ? { type: v } : null)} />
      </div>

      {spec && hasIndex && count > 1 && (
        <Toggle
          on={!scopeThis}
          onChange={setScopeAll}
          label={`Apply to all ${count} “${key}” at this level`}
        />
      )}

      {spec && NEEDS_RANGE.has(spec.type) && (
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="min"
            value={spec.min ?? ''}
            onChange={(e) => update({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="w-[72px] rounded-[6px] border border-border bg-surface px-2 py-[3px] font-mono text-[12px] outline-none"
          />
          <input
            type="number"
            placeholder="max"
            value={spec.max ?? ''}
            onChange={(e) => update({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="w-[72px] rounded-[6px] border border-border bg-surface px-2 py-[3px] font-mono text-[12px] outline-none"
          />
        </div>
      )}

      {spec?.type === 'fixed' && (
        <input
          placeholder="fixed value"
          value={String(spec.value ?? '')}
          onChange={(e) => update({ value: e.target.value })}
          className="w-full rounded-[6px] border border-border bg-surface px-2 py-[3px] font-mono text-[12px] outline-none"
        />
      )}

      {spec && spec.type !== 'fixed' && (
        <div className="flex flex-col gap-1">
          <Toggle on={!spec.once} onChange={(v) => update({ once: !v })} label="Regenerate on every request" />
          {spec.once && (
            <div className="rounded-[6px] border border-warning/40 bg-warning/10 px-2 py-1.5 text-[11px] leading-[1.5] text-warning">
              Frozen — hit <span className="font-semibold">Save</span> to generate a value once and bake
              it into the response body.
            </div>
          )}
        </div>
      )}

      {spec && (
        <div>
          <button
            onClick={() => void runPreview()}
            disabled={busy}
            className="h-[30px] w-full rounded-[8px] border border-border text-[13px] hover:bg-surface-sunken disabled:opacity-40"
          >
            {busy ? 'Generating…' : '⟳ Preview'}
          </button>
          {previewErr && <div className="mt-2 text-[12.5px] text-error">{previewErr}</div>}
          {preview && (
            <div className="mt-2">
              <ResponseView body={preview} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
