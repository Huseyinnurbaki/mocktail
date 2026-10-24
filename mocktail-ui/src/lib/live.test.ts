import { describe, it, expect, vi, afterEach } from 'vitest'
import type { LogEntry } from './api'
import { defaultTab, loadTab, mergeLogs, queryPairs, requestUrl, saveTab } from './live'

const entry = (id: number): LogEntry => ({ id, timestamp: '', message: '', type: 'request', path: `/mocktail/${id}` })
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => entry(from + i))
const ids = (l: LogEntry[]) => l.map((e) => e.id)

describe('mergeLogs', () => {
  it('appends new entries in order', () => {
    expect(ids(mergeLogs(range(1, 3), range(4, 5), 1, 100))).toEqual([1, 2, 3, 4, 5])
  })

  it('returns the same array when a poll brings nothing new (no re-render)', () => {
    const prev = range(1, 3)
    expect(mergeLogs(prev, [], 1, 100)).toBe(prev)
  })

  it('ignores entries it already has (overlapping poll)', () => {
    expect(ids(mergeLogs(range(1, 3), range(2, 4), 1, 100))).toEqual([1, 2, 3, 4])
  })

  it('drops entries the server evicted (id < firstId)', () => {
    expect(ids(mergeLogs(range(1, 5), range(6, 6), 4, 100))).toEqual([4, 5, 6])
  })

  it('empties out after a clear (firstId past everything held)', () => {
    expect(mergeLogs(range(1, 5), [], 6, 100)).toEqual([])
  })

  it('keeps only the newest max entries', () => {
    expect(ids(mergeLogs(range(1, 4), range(5, 7), 1, 3))).toEqual([5, 6, 7])
  })

  it('starts fresh from an empty list (first poll / server restart)', () => {
    expect(ids(mergeLogs([], range(1, 2), 1, 100))).toEqual([1, 2])
  })
})

describe('defaultTab', () => {
  it('opens on Request when the client sent a body', () => {
    expect(defaultTab({ requestSize: 42 })).toBe('request')
  })

  it('opens on Response otherwise', () => {
    expect(defaultTab({ requestSize: 0 })).toBe('response')
    expect(defaultTab({})).toBe('response')
  })
})

describe('queryPairs', () => {
  it('decodes pairs in order, keeping duplicates', () => {
    expect(queryPairs('page=2&tag=a&tag=b&q=hello+world%21')).toEqual([
      ['page', '2'],
      ['tag', 'a'],
      ['tag', 'b'],
      ['q', 'hello world!'],
    ])
  })

  it('is empty for a missing query', () => {
    expect(queryPairs(undefined)).toEqual([])
    expect(queryPairs('')).toEqual([])
  })
})

describe('loadTab / saveTab', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('round-trips the picked tab', () => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => (store[k] = v),
    })
    expect(loadTab()).toBeNull()
    saveTab('request')
    expect(loadTab()).toBe('request')
  })

  it('ignores unknown stored values', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'headers', setItem: () => {} })
    expect(loadTab()).toBeNull()
  })

  it('survives blocked storage', () => {
    const boom = () => {
      throw new Error('SecurityError')
    }
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom })
    expect(loadTab()).toBeNull()
    expect(() => saveTab('response')).not.toThrow()
  })
})

describe('requestUrl', () => {
  it('rebuilds the URL the client hit, query included', () => {
    expect(requestUrl(6790, '/mocktail/api/v1/users', 'page=2&sort=name')).toBe(
      'http://localhost:6790/mocktail/api/v1/users?page=2&sort=name',
    )
  })

  it('omits an empty query and falls back to the default port', () => {
    expect(requestUrl(null, '/mocktail/x', '')).toBe('http://localhost:6625/mocktail/x')
    expect(requestUrl(undefined, '/mocktail/x')).toBe('http://localhost:6625/mocktail/x')
  })
})
