/** Turns a non-OK Response into a readable error message.
 *  Core endpoints return {message}; the AI endpoints return {error}. */
export async function errMessage(res: Response, ctx: string): Promise<string> {
  try {
    const j = (await res.json()) as { message?: string; error?: string }
    const m = j?.message || j?.error
    return m ? `${ctx}: ${m}` : `${ctx} → ${res.status}`
  } catch {
    return `${ctx} → ${res.status}`
  }
}
