import { useEffect, useState } from 'react'
import {
  deleteAIKey,
  fetchAIConfig,
  fetchAIModels,
  fetchAIProviders,
  saveAIConfig,
  type AIConfig,
  type AIModel,
  type AIProvider,
} from '../../lib/ai'
import { errText } from '../../lib/err'

export function ApiKeysTab() {
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [keyInput, setKeyInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  async function refresh(withModels: boolean) {
    const [cfg, prov] = await Promise.all([fetchAIConfig(), fetchAIProviders()])
    setConfig(cfg)
    setProviders(prov.providers)
    if (withModels && cfg.configured) {
      try {
        setModels((await fetchAIModels()).models)
      } catch {
        /* leave prior models; dropdown just won't refresh */
      }
    }
  }

  useEffect(() => {
    refresh(true).catch((e) => setErr(errText(e)))
  }, [])

  const envManaged = config?.source === 'env'
  const configured = config?.configured ?? false

  async function saveKey() {
    const key = keyInput.trim()
    if (!key || busy) return
    setBusy(true)
    setErr(null)
    setNote(null)
    try {
      await saveAIConfig({ apiKey: key })
      setKeyInput('')
      setNote('Key validated and saved.')
      await refresh(true)
    } catch (e) {
      setErr(errText(e))
    } finally {
      setBusy(false)
    }
  }

  async function removeKey() {
    setBusy(true)
    setErr(null)
    setNote(null)
    try {
      await deleteAIKey()
      setModels([])
      await refresh(false)
    } catch (e) {
      setErr(errText(e))
    } finally {
      setBusy(false)
    }
  }

  async function pick(input: { provider?: string; model?: string }) {
    setBusy(true)
    setErr(null)
    setNote(null)
    try {
      await saveAIConfig(input)
      await refresh(!!input.provider) // a provider change re-fetches models
    } catch (e) {
      setErr(errText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <div className="text-[12.5px] leading-[1.55] text-muted">
        Your key is stored on this machine (OS keychain) and used only server-side — it never leaves
        your backend. Powers the ✨ Assistant chat.
      </div>

      {/* Provider */}
      <div className="flex flex-col gap-1">
        <label className="text-[12.5px] text-muted">Provider</label>
        <select
          value={config?.provider ?? ''}
          disabled={busy || providers.length <= 1}
          onChange={(e) => pick({ provider: e.target.value })}
          className="h-[34px] rounded-[8px] border border-border bg-surface px-2 text-[13px] disabled:opacity-60"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* API key */}
      <div className="flex flex-col gap-1">
        <label className="text-[12.5px] text-muted">API key</label>
        {envManaged ? (
          <div className="rounded-[8px] border border-border bg-surface-sunken px-3 py-2 text-[12.5px] text-muted">
            Managed via an environment variable — read-only here.
            {config?.keyHint && <span className="ml-1 font-mono">({config.keyHint})</span>}
          </div>
        ) : configured ? (
          <div className="flex items-center justify-between gap-2 rounded-[8px] border border-border bg-surface-sunken px-3 py-2">
            <span className="text-[12.5px] text-muted">
              Key set <span className="ml-1 font-mono text-fg">{config?.keyHint}</span>
            </span>
            <button
              onClick={removeKey}
              disabled={busy}
              className="text-[12px] text-error hover:underline disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        ) : config && !config.editable ? (
          <div className="rounded-[8px] border border-border bg-surface-sunken px-3 py-2 text-[12.5px] leading-[1.5] text-muted">
            For security, a key can only be set from a session on the machine running Mocktail — not
            over the network. Running in a container or reaching the dashboard remotely? Pass the key as
            an environment variable:
            <div className="mt-1.5 overflow-x-auto rounded-[6px] border border-border bg-surface px-2 py-1 font-mono text-[11.5px] text-fg">
              docker run -e MOCKTAIL_AI_API_KEY_ANTHROPIC=sk-ant-… …
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              type="password"
              placeholder="sk-ant-…"
              className="h-[34px] flex-1 rounded-[8px] border border-border bg-surface px-2 font-mono text-[13px]"
            />
            <button
              onClick={saveKey}
              disabled={busy || !keyInput.trim()}
              className="h-[34px] shrink-0 rounded-[8px] bg-accent px-3 text-[13px] font-semibold text-accent-on disabled:opacity-40"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Model — only meaningful once a key is set */}
      {configured && (
        <div className="flex flex-col gap-1">
          <label className="text-[12.5px] text-muted">Model</label>
          <select
            value={config?.model ?? ''}
            disabled={busy || models.length === 0}
            onChange={(e) => pick({ model: e.target.value })}
            className="h-[34px] rounded-[8px] border border-border bg-surface px-2 text-[13px] disabled:opacity-60"
          >
            {models.length === 0 && <option value={config?.model ?? ''}>{config?.model}</option>}
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
                {m.recommended ? ' · recommended' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {err && <div className="text-[12.5px] text-error">{err}</div>}
      {note && <div className="text-[12.5px] text-success">{note}</div>}
    </div>
  )
}
