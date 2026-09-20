// Admin-key handling for the management API (/core/v1/*).
//
// The backend gates /core/v1/* behind MOCKTAIL_ADMIN_KEY and expects the key in the
// X-Admin-Key header (see mocktail-api/main.go adminAuthMiddleware). It also accepts
// ?admin_key= as a fallback, but we deliberately never use that from the browser: a query
// param leaks into server/proxy access logs, the Referer header, and browser history.
//
// The key is delivered to the dashboard via the URL *fragment* (`#admin_key=<token>`, the URL
// the backend prints at startup). A fragment is never sent to the server, so it can't be logged.
// We read it once on load, keep it in sessionStorage (per-tab, cleared when the tab closes —
// not localStorage, which would persist on disk across sessions), then strip it back out of the
// URL so the token doesn't linger in the address bar, history, or a copied link.

const STORAGE_KEY = 'mocktail.adminKey'

let adminKey: string | null = null

/** Reads #admin_key= from the URL (if present), persists it, and scrubs it from the URL.
 *  Call once at startup, before any /core/v1/* request. */
export function initAdminKey(): void {
  try {
    adminKey = sessionStorage.getItem(STORAGE_KEY)
  } catch {
    /* sessionStorage unavailable (e.g. hardened privacy mode) — fall back to in-memory only */
  }

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
  if (!hash) return

  const params = new URLSearchParams(hash)
  const fromUrl = params.get('admin_key')
  if (!fromUrl) return

  adminKey = fromUrl
  try {
    sessionStorage.setItem(STORAGE_KEY, fromUrl)
  } catch {
    /* keep in-memory copy */
  }

  // Scrub admin_key from the fragment but preserve any other hash state.
  params.delete('admin_key')
  const rest = params.toString()
  const url = window.location.pathname + window.location.search + (rest ? '#' + rest : '')
  window.history.replaceState(null, '', url)
}

export function getAdminKey(): string | null {
  return adminKey
}

/** Stores a key entered by the user (e.g. via the passcode prompt) for the rest of the tab session. */
export function setAdminKey(key: string): void {
  adminKey = key
  try {
    sessionStorage.setItem(STORAGE_KEY, key)
  } catch {
    /* keep in-memory copy */
  }
}

// The app registers a handler here so a 401 from any management call can surface the passcode
// prompt, instead of every call site having to detect and route the auth error itself.
let authRequiredHandler: (() => void) | null = null
export function onAuthRequired(handler: () => void): void {
  authRequiredHandler = handler
}

/** fetch() for same-origin management calls: injects X-Admin-Key when a key is set.
 *  Use ONLY for same-origin endpoints — never route third-party URLs through this, or the
 *  admin key would leak off-origin. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (adminKey) headers.set('X-Admin-Key', adminKey)
  const res = await fetch(input, { ...init, headers })
  // A missing/wrong key means the server is gated — prompt for the passcode.
  if (res.status === 401) authRequiredHandler?.()
  return res
}
