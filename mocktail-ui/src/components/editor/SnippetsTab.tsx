import { useState } from 'react'
import type { Method } from '../../lib/mocks'
import { METHOD_TEXT } from '../../lib/methods'

const LANGS = ['cURL', 'Node', 'Python', 'Go'] as const
type Lang = (typeof LANGS)[number]

function snippetFor(lang: Lang, method: string, path: string): string {
  const url = `http://localhost:4000/mocktail${path}`
  switch (lang) {
    case 'cURL':
      return `curl -X ${method} '${url}'`
    case 'Node':
      return `const res = await fetch('${url}', {\n  method: '${method}',\n})\nconst data = await res.json()`
    case 'Python':
      return `import requests\n\nres = requests.request('${method}', '${url}')\nprint(res.json())`
    case 'Go':
      return `req, _ := http.NewRequest("${method}", "${url}", nil)\nres, _ := http.DefaultClient.Do(req)\ndefer res.Body.Close()`
  }
}

const SNIPPET_KEYWORDS: Record<Lang, string[]> = {
  cURL: ['curl'],
  Node: ['const', 'await', 'fetch'],
  Python: ['import', 'requests', 'print'],
  Go: ['req', 'res', 'http', 'NewRequest', 'DefaultClient', 'Do', 'defer', 'nil'],
}

/** Tiny display-only highlighter: strings → coral, keywords → periwinkle, method → its color. */
function highlightSnippet(code: string, lang: Lang, method: Method) {
  const kw = SNIPPET_KEYWORDS[lang].join('|')
  const re = new RegExp(`('[^']*'|"[^"]*")|\\b(GET|POST|PUT|PATCH|DELETE)\\b|\\b(${kw})\\b`, 'g')
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out.push(code.slice(last, m.index))
    if (m[1]) {
      out.push(
        <span key={i} className="text-error">
          {m[1]}
        </span>,
      )
    } else if (m[2]) {
      out.push(
        <span key={i} className={`font-semibold ${METHOD_TEXT[m[2] as Method]}`}>
          {m[2]}
        </span>,
      )
    } else if (m[3]) {
      out.push(
        <span key={i} className="text-param">
          {m[3]}
        </span>,
      )
    }
    last = m.index + m[0].length
    i++
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

export function SnippetsTab({ method, path }: { method: Method; path: string }) {
  const [lang, setLang] = useState<Lang>('cURL')
  const [copied, setCopied] = useState(false)
  const code = snippetFor(lang, method, path)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="min-w-0">
      {/* language segmented control */}
      <div className="mb-3 flex gap-[2px] rounded-[8px] border border-border p-[2px]">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`flex-1 rounded-[6px] py-[5px] text-[12px] ${
              lang === l ? 'bg-accent-tint text-accent-text' : 'text-muted hover:text-fg'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span className="truncate font-mono text-[11.5px] text-muted">
          {method} {path}
        </span>
        <button
          onClick={() => void copy()}
          className="ml-auto shrink-0 text-[12px] text-accent-text hover:underline"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="w-full whitespace-pre-wrap break-all rounded-[9px] border border-border bg-surface-sunken p-3 font-mono text-[11.5px] leading-[1.7]">
        {highlightSnippet(code, lang, method)}
      </pre>
    </div>
  )
}
