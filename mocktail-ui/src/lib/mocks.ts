export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
export const STATUS_GROUPS: { label: string; codes: [number, string][] }[] = [
  {
    label: 'Success · 2xx',
    codes: [
      [200, 'OK'],
      [201, 'Created'],
      [202, 'Accepted'],
      [204, 'No Content'],
    ],
  },
  {
    label: 'Redirect · 3xx',
    codes: [
      [301, 'Moved Permanently'],
      [302, 'Found'],
      [304, 'Not Modified'],
    ],
  },
  {
    label: 'Client error · 4xx',
    codes: [
      [400, 'Bad Request'],
      [401, 'Unauthorized'],
      [403, 'Forbidden'],
      [404, 'Not Found'],
      [409, 'Conflict'],
      [422, 'Unprocessable Entity'],
      [429, 'Too Many Requests'],
    ],
  },
  {
    label: 'Server error · 5xx',
    codes: [
      [500, 'Internal Server Error'],
      [502, 'Bad Gateway'],
      [503, 'Service Unavailable'],
    ],
  },
]

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

/** Custom response headers: header name → value. */
export type HeadersConfig = Record<string, string>

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
  /** Pretty-printed JSON response body. */
  body: string
  randomize: RandomizeConfig
  headers: HeadersConfig
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
  headers: HeadersConfig
}

export function newDraft(): Draft {
  return {
    id: null,
    method: 'GET',
    path: '/',
    status: 200,
    delayMs: 0,
    body: '{\n  \n}',
    randomize: {},
    headers: {},
  }
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
    headers: m.headers,
  }
}


