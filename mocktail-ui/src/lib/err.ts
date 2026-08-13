/** Best-effort message from an unknown thrown value (Error or otherwise). */
export function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
