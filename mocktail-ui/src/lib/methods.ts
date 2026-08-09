import type { Method } from './mocks'

/** Badge background + text classes per HTTP method. */
export const METHOD_BADGE: Record<Method, string> = {
  GET: 'bg-get-bg text-get-fg',
  POST: 'bg-post-bg text-post-fg',
  PUT: 'bg-put-bg text-put-fg',
  PATCH: 'bg-put-bg text-put-fg',
  DELETE: 'bg-del-bg text-del-fg',
}

/** Text-only color per method (for inline text, e.g. code snippets). */
export const METHOD_TEXT: Record<Method, string> = {
  GET: 'text-get-fg',
  POST: 'text-post-fg',
  PUT: 'text-put-fg',
  PATCH: 'text-put-fg',
  DELETE: 'text-del-fg',
}
