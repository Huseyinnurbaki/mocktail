import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, StateEffect, StateField, RangeSetBuilder, type Text } from '@codemirror/state'
import { Decoration, WidgetType, type DecorationSet } from '@codemirror/view'
import { json } from '@codemirror/lang-json'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

export interface Highlight {
  key: string
  label: string
}

// Syntax colors from the handoff: keys hue 265, strings hue 30, numbers/bool hue 165.
const highlight = HighlightStyle.define([
  { tag: t.propertyName, color: 'var(--param)' },
  { tag: [t.string], color: 'var(--error)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--success)' },
  { tag: [t.punctuation, t.separator, t.brace, t.bracket], color: 'var(--text)' },
])

const theme = EditorView.theme({
  '&': { backgroundColor: 'var(--surface-sunken)', color: 'var(--text)', height: '100%', fontSize: '12.5px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.85' },
  '.cm-content': { padding: '10px 0' },
  '.cm-gutters': { backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--accent-tint)' },
  // Randomized-field decorations
  '.cm-rand-line': { backgroundColor: 'var(--accent-tint)' },
  '.cm-rand-label': { color: 'var(--accent-text)', fontStyle: 'italic', opacity: '0.9' },
})

// ---- Randomized-field highlighting -----------------------------------------

const setHighlights = StateEffect.define<Highlight[]>()

class LabelWidget extends WidgetType {
  constructor(readonly label: string) {
    super()
  }
  eq(o: LabelWidget) {
    return o.label === this.label
  }
  toDOM() {
    const s = document.createElement('span')
    s.className = 'cm-rand-label'
    s.textContent = '  ' + this.label
    return s
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildDeco(doc: Text, keys: Highlight[]): DecorationSet {
  const b = new RangeSetBuilder<Decoration>()
  if (keys.length === 0) return b.finish()
  const matchers = keys.map((k) => ({ re: new RegExp(`"${escapeRe(k.key)}"\\s*:`), label: k.label }))
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    for (const m of matchers) {
      if (m.re.test(line.text)) {
        b.add(line.from, line.from, Decoration.line({ attributes: { class: 'cm-rand-line' } }))
        b.add(line.to, line.to, Decoration.widget({ widget: new LabelWidget(m.label), side: 1 }))
        break
      }
    }
  }
  return b.finish()
}

const highlightField = StateField.define<{ deco: DecorationSet; keys: Highlight[] }>({
  create: () => ({ deco: Decoration.none, keys: [] }),
  update(val, tr) {
    let keys = val.keys
    let changed = tr.docChanged
    for (const e of tr.effects) {
      if (e.is(setHighlights)) {
        keys = e.value
        changed = true
      }
    }
    if (changed) return { keys, deco: buildDeco(tr.state.doc, keys) }
    return { keys, deco: val.deco.map(tr.changes) }
  },
  provide: (f) => EditorView.decorations.from(f, (v) => v.deco),
})

// ---- Component --------------------------------------------------------------

/** Controlled CodeMirror 6 JSON editor themed to the Mocktail tokens. */
export function CodeEditor({
  value,
  onChange,
  highlights = [],
}: {
  value: string
  onChange: (v: string) => void
  highlights?: Highlight[]
}) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Create the editor once.
  useEffect(() => {
    if (!host.current) return
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        json(),
        syntaxHighlighting(highlight),
        highlightField,
        theme,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString())
        }),
      ],
    })
    const v = new EditorView({ state, parent: host.current })
    view.current = v
    return () => {
      v.destroy()
      view.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external value changes (e.g. the Format button) without clobbering typing.
  useEffect(() => {
    const v = view.current
    if (v && value !== v.state.doc.toString()) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } })
    }
  }, [value])

  // Push highlight changes into the editor.
  useEffect(() => {
    view.current?.dispatch({ effects: setHighlights.of(highlights) })
  }, [highlights])

  return <div ref={host} className="h-full overflow-auto" />
}
