const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** Modifier-key glyph for shortcut hints — ⌘ on macOS, Ctrl elsewhere. */
export const MOD = IS_MAC ? '⌘' : 'Ctrl'
