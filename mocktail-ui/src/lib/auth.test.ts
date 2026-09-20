import { describe, it, expect, vi, beforeEach } from 'vitest'

// auth.ts holds module-level state (the current admin key), so each test imports a fresh copy
// after stubbing the browser globals it reads (window, sessionStorage, fetch).

function setupEnv({ hash = '', store = {} }: { hash?: string; store?: Record<string, string> } = {}) {
  const sessionStore: Record<string, string> = { ...store }
  const replaced: { url: string | null } = { url: null }
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => (k in sessionStore ? sessionStore[k] : null),
    setItem: (k: string, v: string) => {
      sessionStore[k] = String(v)
    },
    removeItem: (k: string) => {
      delete sessionStore[k]
    },
  })
  vi.stubGlobal('window', {
    location: { hash, pathname: '/', search: '' },
    history: { replaceState: (_s: unknown, _t: unknown, u: string) => (replaced.url = u) },
  })
  return { sessionStore, replaced }
}

async function freshAuth() {
  vi.resetModules()
  return import('./auth')
}

// Records the last fetch(input, init) so tests can assert on headers/URL. Returns the given status.
function stubFetch(status = 200) {
  const calls: { input: string; init: RequestInit }[] = []
  vi.stubGlobal('fetch', (input: string, init: RequestInit = {}) => {
    calls.push({ input, init })
    return Promise.resolve({ status, ok: status >= 200 && status < 300 } as Response)
  })
  return calls
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('initAdminKey', () => {
  it('leaves no key when there is no fragment and nothing stored', async () => {
    setupEnv({ hash: '' })
    const auth = await freshAuth()
    auth.initAdminKey()
    expect(auth.getAdminKey()).toBeNull()
  })

  it('extracts the key from #admin_key=, persists it, and scrubs the URL', async () => {
    const { sessionStore, replaced } = setupEnv({ hash: '#admin_key=secret' })
    const auth = await freshAuth()
    auth.initAdminKey()
    expect(auth.getAdminKey()).toBe('secret')
    expect(sessionStore['mocktail.adminKey']).toBe('secret')
    expect(replaced.url).toBe('/')
    expect(replaced.url).not.toContain('admin_key')
  })

  it('preserves other fragment params while stripping admin_key', async () => {
    const { replaced } = setupEnv({ hash: '#admin_key=secret&tab=live' })
    const auth = await freshAuth()
    auth.initAdminKey()
    expect(replaced.url).toBe('/#tab=live')
  })

  it('restores the key from sessionStorage on reload (no fragment present)', async () => {
    const { replaced } = setupEnv({ hash: '', store: { 'mocktail.adminKey': 'secret' } })
    const auth = await freshAuth()
    auth.initAdminKey()
    expect(auth.getAdminKey()).toBe('secret')
    expect(replaced.url).toBeNull() // no fragment → no URL rewrite
  })

  it('still captures and scrubs an invalid key (validation is the backend’s job)', async () => {
    const { replaced } = setupEnv({ hash: '#admin_key=wrongkey' })
    const auth = await freshAuth()
    auth.initAdminKey()
    expect(auth.getAdminKey()).toBe('wrongkey')
    expect(replaced.url).toBe('/')
  })
})

describe('apiFetch', () => {
  it('injects X-Admin-Key when a key is set and preserves other init', async () => {
    setupEnv({ hash: '#admin_key=secret' })
    const auth = await freshAuth()
    auth.initAdminKey()
    const calls = stubFetch(200)
    await auth.apiFetch('/core/v1/apis', { cache: 'no-store' })
    const headers = new Headers(calls[0].init.headers)
    expect(headers.get('X-Admin-Key')).toBe('secret')
    expect(calls[0].init.cache).toBe('no-store')
  })

  it('never puts the key in the URL as a query param', async () => {
    setupEnv({ hash: '#admin_key=secret' })
    const auth = await freshAuth()
    auth.initAdminKey()
    const calls = stubFetch(200)
    await auth.apiFetch('/core/v1/apis')
    expect(calls[0].input).not.toContain('admin_key')
  })

  it('sends no admin header when no key is set', async () => {
    setupEnv({ hash: '' })
    const auth = await freshAuth()
    auth.initAdminKey()
    const calls = stubFetch(200)
    await auth.apiFetch('/core/v1/apis')
    expect(new Headers(calls[0].init.headers).has('X-Admin-Key')).toBe(false)
  })

  it('fires the auth-required handler on 401 but not on 200', async () => {
    setupEnv({ hash: '#admin_key=wrongkey' })
    const auth = await freshAuth()
    auth.initAdminKey()
    let fired = 0
    auth.onAuthRequired(() => fired++)

    stubFetch(401)
    await auth.apiFetch('/core/v1/apis')
    expect(fired).toBe(1)

    stubFetch(200)
    await auth.apiFetch('/core/v1/apis')
    expect(fired).toBe(1) // unchanged
  })
})

describe('setAdminKey', () => {
  it('persists a typed key and uses it on subsequent calls (overwriting a bad one)', async () => {
    const { sessionStore } = setupEnv({ hash: '#admin_key=wrongkey' })
    const auth = await freshAuth()
    auth.initAdminKey()
    expect(auth.getAdminKey()).toBe('wrongkey')

    auth.setAdminKey('rightkey')
    expect(auth.getAdminKey()).toBe('rightkey')
    expect(sessionStore['mocktail.adminKey']).toBe('rightkey')

    const calls = stubFetch(200)
    await auth.apiFetch('/core/v1/apis')
    expect(new Headers(calls[0].init.headers).get('X-Admin-Key')).toBe('rightkey')
  })
})
