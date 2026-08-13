import { useEffect } from 'react'
import type { Mock } from '../lib/mocks'

interface Args {
  enabled: boolean // false while an overlay is open
  selectedMock: Mock | null
  onFocusSearch: () => void
  onOpenSettings: () => void
  onOpenLive: () => void
  onNew: () => void
  onOpen: (m: Mock) => void
  onRun: (m: Mock) => void
  onDuplicate: (m: Mock) => void
  onMove: (delta: number) => void
}

/**
 * Catalog keyboard shortcuts — off while an overlay is open or while typing in a field.
 * ⌘F search · ⌘O settings · ⌘L live · ⌘C copy path · ⌘E new · ⌘D duplicate · ⌘↵ run · ↵ open · ↑↓ navigate.
 */
export function useCatalogShortcuts({
  enabled,
  selectedMock,
  onFocusSearch,
  onOpenSettings,
  onOpenLive,
  onNew,
  onOpen,
  onRun,
  onDuplicate,
  onMove,
}: Args) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!enabled) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        onFocusSearch()
        return
      }
      if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        onOpenSettings()
        return
      }
      if (mod && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        onOpenLive()
        return
      }
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return
      if (mod && e.key.toLowerCase() === 'c') {
        if (window.getSelection()?.toString()) return // let a real text selection copy normally
        e.preventDefault()
        if (selectedMock) void navigator.clipboard?.writeText(selectedMock.path)
        return
      }
      if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        onNew()
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        if (selectedMock) onDuplicate(selectedMock)
      } else if (e.key === 'Enter' && mod) {
        e.preventDefault()
        if (selectedMock) onRun(selectedMock)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedMock) onOpen(selectedMock)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        onMove(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        onMove(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
}
