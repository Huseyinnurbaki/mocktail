import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, StateEffect, StateField, RangeSetBuilder, type Text } from '@codemirror/state'
import { Decoration, WidgetType, type DecorationSet } from '@codemirror/view'
import { json } from '@codemirror/lang-json'
import { HighlightStyle, syntaxHighlighting, syntaxTree } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import type { SyntaxNode } from '@lezer/common'

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
  // Keep these translucent — an opaque active-line fill paints over the selection
  // layer (which sits behind the content) and hides the highlighted word.
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--border-subtle) 45%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'color-mix(in srgb, var(--border-subtle) 45%, transparent)' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)' },
  '.cm-selectionLayer .cm-selectionBackground, &.cm-focused .cm-selectionLayer .cm-selectionBackground':
    { backgroundColor: 'color-mix(in srgb, var(--accent) 70%, transparent)' },
  '.cm-content ::selection': { backgroundColor: 'color-mix(in srgb, var(--accent) 70%, transparent)' },
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

// ---- Click → JSON path ------------------------------------------------------

const VALUE_NODES = new Set(['Object', 'Array', 'String', 'Number', 'True', 'False', 'Null'])

/**
 * Dot-path of the field at `pos`, including array indices (e.g. "users.0.name").
 * Returns null unless the click is on a *leaf* field — objects/arrays aren't
 * configurable (you can't assign a generator to a whole array/object).
 */
function pathAtPos(state: EditorState, pos: number): string | null {
  const inner: SyntaxNode = syntaxTree(state).resolveInner(pos, 0)

  // Innermost enclosing property.
  let prop: SyntaxNode | null = inner
  while (prop && prop.name !== 'Property') prop = prop.parent
  if (!prop) return null

  // Reject container values — only scalar leaves get a generator.
  if (prop.getChild('Object') || prop.getChild('Array')) return null

  const segs: string[] = []
  let n: SyntaxNode | null = prop
  while (n) {
    if (n.name === 'Property') {
      const nameNode = n.getChild('PropertyName')
      if (nameNode) {
        const raw = state.doc.sliceString(nameNode.from, nameNode.to)
        try {
          segs.unshift(JSON.parse(raw) as string)
        } catch {
          segs.unshift(raw.replace(/^"|"$/g, ''))
        }
      }
    }
    // If this node is an array element, prepend its index.
    const parent: SyntaxNode | null = n.parent
    if (parent && parent.name === 'Array') {
      let idx = 0
      let c = parent.firstChild
      while (c && c.from < n.from) {
        if (VALUE_NODES.has(c.name)) idx++
        c = c.nextSibling
      }
      segs.unshift(String(idx))
    }
    n = parent
  }
  return segs.length ? segs.join('.') : null
}

/**
 * Path for a click: try the exact position, else fall back to the leaf field on
 * the same line — so clicking anywhere on a field's row (after the comma, the
 * trailing whitespace, etc.) still selects it.
 */
function pathAtClick(state: EditorState, pos: number): string | null {
  const exact = pathAtPos(state, pos)
  if (exact) return exact
  const line = state.doc.lineAt(pos)
  const q = line.text.indexOf('"')
  return q >= 0 ? pathAtPos(state, line.from + q + 1) : null
}

// ---- Component --------------------------------------------------------------

/** Controlled CodeMirror 6 JSON editor themed to the Mocktail tokens. */
export function CodeEditor({
  value,
  onChange,
  highlights = [],
  onSelectField,
  readOnly = false,
}: {
  value: string
  onChange: (v: string) => void
  highlights?: Highlight[]
  onSelectField?: (path: string | null) => void
  readOnly?: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onSelectFieldRef = useRef(onSelectField)
  onSelectFieldRef.current = onSelectField

  // Create the editor once.
  useEffect(() => {
    if (!host.current) return
    const extensions = [
      basicSetup,
      json(),
      syntaxHighlighting(highlight),
      highlightField,
      theme,
      EditorView.updateListener.of((u) => {
        if (u.docChanged) onChangeRef.current(u.state.doc.toString())
      }),
      EditorView.domEventHandlers({
        mouseup(e, v) {
          if (e.detail > 1) return false // word/line selection — handled below
          const pos = v.posAtCoords({ x: e.clientX, y: e.clientY })
          if (pos != null) onSelectFieldRef.current?.(pathAtClick(v.state, pos))
          return false
        },
        // Explicitly select the word on double-click (don't rely on native
        // word-select, which something in this setup was suppressing).
        // Native word-select is being suppressed in this setup, so select the
        // word explicitly on double-click via CM's own API.
        dblclick(e, v) {
          const pos = v.posAtCoords({ x: e.clientX, y: e.clientY })
          const word = pos != null ? v.state.wordAt(pos) : null
          if (!word) return false
          v.dispatch({ selection: { anchor: word.from, head: word.to } })
          v.focus()
          return true
        },
      }),
    ]
    if (readOnly) extensions.push(EditorState.readOnly.of(true), EditorView.editable.of(false))
    const state = EditorState.create({ doc: value, extensions })
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
