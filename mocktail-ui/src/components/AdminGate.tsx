import { useState } from 'react'
import { setAdminKey } from '../lib/auth'

// Shown when the management API (/core/v1/*) returns 401 and we have no valid admin key — i.e. the
// instance was started with MOCKTAIL_ADMIN_KEY set and the dashboard wasn't opened via the printed
// #admin_key= URL. Lets the user paste the key. We validate it against the backend BEFORE storing it,
// so a wrong key gets inline feedback instead of a blind reload loop. The key is sent as the
// X-Admin-Key header (never ?admin_key=) and, once valid, kept in sessionStorage for this tab.
export function AdminGate() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const key = value.trim()
    if (!key || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/core/v1/apis', { headers: { 'X-Admin-Key': key } })
      if (res.status === 401) {
        setError('Invalid admin key.')
        setBusy(false)
        return
      }
      if (!res.ok) {
        setError(`Unexpected response (${res.status}).`)
        setBusy(false)
        return
      }
      // Valid — persist it and reload so every hook refetches with the key in place.
      setAdminKey(key)
      window.location.reload()
    } catch {
      setError("Couldn't reach the backend.")
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="w-[380px] max-w-full rounded-[14px] border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="text-[15px] font-semibold">Admin key required</div>
        <p className="mt-1.5 text-[13px] text-muted">
          This instance is protected by <code className="text-[12px]">MOCKTAIL_ADMIN_KEY</code>. Enter
          the key to access the dashboard.
        </p>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          placeholder="Admin key"
          className="mt-4 w-full rounded-[8px] border border-border bg-surface-sunken px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
        {error && <div className="mt-2 text-[12px] text-red-500">{error}</div>}
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="mt-4 w-full rounded-[8px] bg-accent px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
