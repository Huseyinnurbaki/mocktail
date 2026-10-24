/** Pretty-print JSON when possible; leave non-JSON text as-is. */
export function beautify(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

/**
 * Bodies above this are shown raw by default (with a Format button). indentJson is one fast pass and
 * many short lines render faster than one long line, so this only guards against bodies far above
 * the default 1 MB log cap (MOCKTAIL_LOG_BODY_KB raised high).
 */
export const PRETTY_LIMIT = 4 * 1024 * 1024

/** Pretty-print `text` for display unless it's over `limit` (or `force` is set). */
export function formatForView(text: string, force = false, limit = PRETTY_LIMIT): { text: string; raw: boolean } {
  if (!force && text.length > limit) return { text, raw: true }
  return { text: indentJson(text) ?? text, raw: false }
}

const QUOTE = 34 // "
const BACKSLASH = 92
const COMMA = 44
const COLON = 58
const OPEN_BRACE = 123
const CLOSE_BRACE = 125
const OPEN_BRACKET = 91
const CLOSE_BRACKET = 93
const isSpace = (c: number) => c === 32 || c === 10 || c === 13 || c === 9

/**
 * Indent JSON-looking text in one pass *without parsing it*, so a body the log truncated mid-document
 * still renders indented (and as many short lines, which the editor draws far faster than one huge
 * line). Strings and other tokens are copied verbatim; only whitespace between tokens is re-laid out.
 * Valid compact JSON comes out matching `JSON.stringify(v, null, 2)`. Returns null for text that
 * doesn't start like JSON.
 */
export function indentJson(text: string): string | null {
  const n = text.length
  let i = 0
  while (i < n && isSpace(text.charCodeAt(i))) i++
  const first = text.charCodeAt(i)
  if (first !== OPEN_BRACE && first !== OPEN_BRACKET) return null

  const out: string[] = []
  const pads = ['']
  let depth = 0
  const newline = () => (pads[depth] ??= '\n' + '  '.repeat(depth))
  pads[0] = '\n'

  for (; i < n; i++) {
    const c = text.charCodeAt(i)
    if (c === QUOTE) {
      let j = i + 1
      while (j < n && text.charCodeAt(j) !== QUOTE) j += text.charCodeAt(j) === BACKSLASH ? 2 : 1
      out.push(text.slice(i, j + 1)) // an unterminated (truncated) string runs to the end
      i = j
    } else if (c === OPEN_BRACE || c === OPEN_BRACKET) {
      let j = i + 1
      while (j < n && isSpace(text.charCodeAt(j))) j++
      if (j < n && text.charCodeAt(j) === (c === OPEN_BRACE ? CLOSE_BRACE : CLOSE_BRACKET)) {
        out.push(text[i] + text[j]) // keep {} and [] inline
        i = j
        continue
      }
      depth++
      out.push(text[i], newline())
    } else if (c === CLOSE_BRACE || c === CLOSE_BRACKET) {
      depth = Math.max(0, depth - 1)
      out.push(newline(), text[i])
    } else if (c === COMMA) {
      out.push(',', newline())
    } else if (c === COLON) {
      out.push(': ')
    } else if (!isSpace(c)) {
      let j = i + 1 // numbers, true/false/null — copy the run in one go
      while (j < n) {
        const d = text.charCodeAt(j)
        if (isSpace(d) || d === COMMA || d === COLON || d === CLOSE_BRACE || d === CLOSE_BRACKET || d === QUOTE) break
        if (d === OPEN_BRACE || d === OPEN_BRACKET) break
        j++
      }
      out.push(text.slice(i, j))
      i = j - 1
    }
  }
  return out.join('')
}

/** Human-readable byte size: 512 B, 1.5 KB, 3.2 MB. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1).replace(/\.0$/, '')} KB`
  return `${(n / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`
}

/** Tailwind text-color class for an HTTP status. */
export function statusColor(status: number): string {
  return status < 300 ? 'text-success' : 'text-error'
}

/** Tailwind pill (bg + text) class for an HTTP status. */
export function statusBadgeClass(status: number): string {
  if (status < 300) return 'bg-get-bg text-get-fg'
  if (status < 400) return 'bg-put-bg text-put-fg'
  return 'bg-del-bg text-del-fg'
}
