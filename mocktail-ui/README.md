# mocktail-ui

The Mocktail dashboard — the **"Workbench" (1a)** redesign. This is the single UI served by the Go
binary (browser today, desktop webview later). It replaced the old CRA/Chakra `mocktail-dashboard/`,
which was removed at cutover.

## Stack

- **Vite 6** + **React 18** + **TypeScript**
- **Tailwind v4** (CSS-first `@theme`; OKLCH design tokens in `src/index.css`)
- **CodeMirror 6** — JSON editor with custom syntax highlighting, click-to-configure fields, and
  inline decorations for randomized/anonymized fields
- Portal-based dropdowns/menus (no component library); self-hosted fonts (Instrument Sans, Geist Mono)
- Theming: system / light / dark via `data-theme`, plus accent palettes (`src/lib/theme.ts`)

## Run

```console
yarn install
yarn dev        # http://localhost:3001 (proxies /core, /mocktail, /health → backend :6625)
yarn build      # → build/  (served by the Go binary)
yarn typecheck
```

The backend must be running (default `:6625`) — see the root `readme.md`.

## Layout

- `src/App.tsx` — catalog container (base-path tree, list, right panel, search, shortcuts)
- `src/components/` — `Editor`, `LiveView`, `SettingsModal`, `catalog/*`, `editor/*`, `CodeEditor`
- `src/lib/` — `api` (backend calls), `mocks` (types + tree builder), `theme`, `export`, `json`
- `src/hooks/` — `useMocks`, `useSend`, `useResizable`, `useCatalogShortcuts`
