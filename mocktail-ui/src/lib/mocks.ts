export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
export const COMMON_STATUS = [200, 201, 202, 204, 301, 400, 401, 403, 404, 409, 422, 429, 500, 503]

/** Per-field faker spec sent to the backend (see mocktail-api/randomize). */
export interface FieldSpec {
  type: string
  min?: number
  max?: number
  value?: unknown // used when type === "fixed"
  prompt?: string // used when type === "ai"
  once?: boolean // true = generate once and bake into the body at save; else per-request
}

/** Maps a dot-path (e.g. "users.email") to its generator. */
export type RandomizeConfig = Record<string, FieldSpec>

/** Plain generator types the backend supports (special modes "fixed"/"ai" handled separately). */
export const FAKER_TYPES = [
  'uuid', 'firstName', 'lastName', 'fullName', 'email', 'phone', 'username',
  'url', 'domain', 'ipv4', 'number', 'float', 'price', 'bool', 'word',
  'sentence', 'paragraph', 'pastDate', 'futureDate', 'city', 'country',
  'countryCode', 'hexColor',
] as const

export interface Mock {
  id: number
  method: Method
  path: string
  status: number
  delayMs: number
  hits: number
  /** Pretty-printed JSON response body. */
  body: string
  randomize: RandomizeConfig
}

/** Editable form state for the endpoint editor. `id === null` means a new mock. */
export interface Draft {
  id: number | null
  method: Method
  path: string
  status: number
  delayMs: number
  body: string
  randomize: RandomizeConfig
}

export function newDraft(): Draft {
  return { id: null, method: 'GET', path: '/', status: 200, delayMs: 0, body: '{\n  \n}', randomize: {} }
}

export function mockToDraft(m: Mock): Draft {
  return {
    id: m.id,
    method: m.method,
    path: m.path,
    status: m.status,
    delayMs: m.delayMs,
    body: m.body,
    randomize: m.randomize,
  }
}

// ---- Two-level compact catalog tree ----------------------------------------
// Level 1 (base): first two segments, e.g. /api/v1  (leaf-only if the path is shorter)
// Level 2 (resource): first three segments, e.g. /api/v1/users
// The tree bottoms out at the resource — deeper paths (/users/:id, /users/profile)
// fold into their resource, and methods never appear here (they show in the list).

export function pathSegs(p: string): string[] {
  return p.split('/').filter(Boolean)
}

export function baseKey(p: string): string {
  const s = pathSegs(p)
  return s.length >= 2 ? '/' + s.slice(0, 2).join('/') : '/' + (s[0] ?? '')
}

export function resourceKey(p: string): string | null {
  const s = pathSegs(p)
  return s.length >= 3 ? '/' + s.slice(0, 3).join('/') : null
}

/** True when a mock belongs to the selected base/resource group (null = all). */
export function matchesGroup(m: Mock, key: string | null): boolean {
  if (!key) return true
  return baseKey(m.path) === key || resourceKey(m.path) === key
}

export interface TreeResource {
  key: string
  label: string
  count: number
}

export interface TreeBase {
  key: string
  label: string
  count: number
  resources: TreeResource[]
}

export function buildTree(mocks: Mock[]): TreeBase[] {
  const bases = new Map<string, Mock[]>()
  for (const m of mocks) {
    const b = baseKey(m.path)
    const arr = bases.get(b)
    if (arr) arr.push(m)
    else bases.set(b, [m])
  }
  return [...bases.entries()].map(([key, items]) => {
    const resCount = new Map<string, number>()
    for (const m of items) {
      const r = resourceKey(m.path)
      if (r) resCount.set(r, (resCount.get(r) ?? 0) + 1)
    }
    const resources: TreeResource[] = [...resCount.entries()].map(([rk, count]) => ({
      key: rk,
      label: '/' + pathSegs(rk).slice(2).join('/'), // 3rd segment onward → /users
      count,
    }))
    return { key, label: key, count: items.length, resources }
  })
}

export function fmtHits(n: number): string {
  if (n < 1000) return String(n)
  const k = n / 1000
  return (k >= 10 ? Math.round(k) : k.toFixed(1)) + 'k'
}
