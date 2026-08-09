/** JSON validity check; returns an error message or null. Empty is treated as {}. */
export function validateJson(text: string): string | null {
  if (!text.trim()) return null
  try {
    JSON.parse(text)
    return null
  } catch (e) {
    return e instanceof Error ? e.message.replace(/^JSON\.parse: /, '') : 'Invalid JSON'
  }
}

/** How many concrete fields a dot-path resolves to (arrays expand to every element). */
export function countTargets(data: unknown, segs: string[]): number {
  if (Array.isArray(data)) return data.reduce((n, item) => n + countTargets(item, segs), 0)
  if (segs.length === 0) return 1
  if (data && typeof data === 'object' && segs[0] in (data as object)) {
    return countTargets((data as Record<string, unknown>)[segs[0]], segs.slice(1))
  }
  return 0
}
