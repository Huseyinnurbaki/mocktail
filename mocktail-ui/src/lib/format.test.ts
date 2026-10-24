import { describe, it, expect } from 'vitest'
import { formatBytes, formatForView, indentJson } from './format'

describe('formatForView', () => {
  it('pretty-prints JSON under the limit', () => {
    expect(formatForView('{"a":1}')).toEqual({ text: '{\n  "a": 1\n}', raw: false })
  })

  it('leaves non-JSON text as-is', () => {
    expect(formatForView('plain text')).toEqual({ text: 'plain text', raw: false })
  })

  it('shows bodies over the limit raw, without formatting them', () => {
    const big = '{"a":1}'
    expect(formatForView(big, false, 3)).toEqual({ text: big, raw: true })
  })

  it('formats an over-limit body when forced', () => {
    expect(formatForView('{"a":1}', true, 3)).toEqual({ text: '{\n  "a": 1\n}', raw: false })
  })
})

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [1024 * 1024, '1 MB'],
    [3.25 * 1024 * 1024, '3.3 MB'],
  ])('%d → %s', (n, want) => {
    expect(formatBytes(n)).toBe(want)
  })
})

describe('indentJson', () => {
  const samples: unknown[] = [
    { a: 1 },
    [],
    {},
    { empty: {}, list: [], nested: { deep: [1, [2, [3]], { x: null }] } },
    [true, false, null, -1.5e-7, 0, 'str'],
    { tricky: 'commas, colons: {braces} [brackets] "quotes" \\ backslash', unicode: 'héllo 😀 \u2028' },
    { 'key with spaces': 'v', '': '' },
  ]

  it.each(samples.map((v) => [JSON.stringify(v), v]))('matches JSON.stringify(v, null, 2) for %s', (_s, v) => {
    expect(indentJson(JSON.stringify(v))).toBe(JSON.stringify(v, null, 2))
  })

  it('re-lays out already-indented or oddly spaced JSON', () => {
    expect(indentJson('  {\n\t"a" :  [ 1 ,2 ] ,\r\n "b":{ } }')).toBe('{\n  "a": [\n    1,\n    2\n  ],\n  "b": {}\n}')
  })

  it('indents a body truncated mid-string', () => {
    expect(indentJson('{"rows":[{"id":0,"note":"payload pay')).toBe(
      '{\n  "rows": [\n    {\n      "id": 0,\n      "note": "payload pay',
    )
  })

  it('indents a body truncated mid-escape or mid-number', () => {
    expect(indentJson('[1,"a\\')).toBe('[\n  1,\n  "a\\')
    expect(indentJson('{"n":12')).toBe('{\n  "n": 12')
  })

  it('returns null for non-JSON text', () => {
    expect(indentJson('plain text')).toBeNull()
    expect(indentJson('<html></html>')).toBeNull()
    expect(indentJson('')).toBeNull()
    expect(indentJson('42')).toBeNull()
  })

  it('handles a 1 MB single-line body quickly', () => {
    const big = JSON.stringify({ rows: Array.from({ length: 12000 }, (_, i) => ({ id: i, note: 'payload '.repeat(8) })) })
    const t0 = performance.now()
    const out = indentJson(big.slice(0, 1024 * 1024))!
    const ms = performance.now() - t0
    expect(out.split('\n').length).toBeGreaterThan(30000)
    expect(ms).toBeLessThan(500) // generous for CI; ~10–30ms locally
  })
})
