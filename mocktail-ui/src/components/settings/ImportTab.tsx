import { useState } from 'react'
import { importMocks, type ImportResult } from '../../lib/api'
import { errText } from '../../lib/err'

export function ImportTab({ onImported }: { onImported: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setErr(null)
    setResult(null)
    try {
      const r = await importMocks(text)
      setResult(r)
      onImported()
    } catch (e) {
      setErr(errText(e))
    } finally {
      setBusy(false)
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) void f.text().then(setText)
  }

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <div className="text-[12.5px] text-muted">
        Paste exported mocks JSON (an array or <span className="font-mono">{'{ "Apis": [...] }'}</span>),
        or choose a file. Existing paths are skipped.
      </div>
      <input type="file" accept="application/json,.json" onChange={onFile} className="text-[12px]" />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={'[ { "Method": "GET", "Endpoint": "/api/v1/users", "Response": { } } ]'}
        className="w-full resize-none rounded-[8px] border border-border bg-surface-sunken p-3 font-mono text-[12px] outline-none"
      />
      <button
        onClick={() => void run()}
        disabled={busy || !text.trim()}
        className="h-[32px] rounded-[8px] bg-accent text-[13px] font-semibold text-accent-on disabled:opacity-40"
      >
        {busy ? 'Importing…' : 'Import mocks'}
      </button>
      {err && <div className="text-[12.5px] text-error">{err}</div>}
      {result && (
        <div className="text-[12.5px] text-muted">
          Imported <span className="text-success">{result.imported}</span> · skipped {result.skipped}{' '}
          · failed {result.failed}
        </div>
      )}
    </div>
  )
}
