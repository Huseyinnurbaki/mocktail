/** Pretty-print JSON when possible; leave non-JSON text as-is. */
export function beautify(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
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
