# mocktail-ui

The Mocktail dashboard, rebuilt for the **"Workbench" (1a)** redesign. Replaces
`mocktail-dashboard/` (retired at cutover — see `../roadmap.md`).

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind v4** (CSS-first `@theme`; OKLCH design tokens in `src/index.css`)
- **Radix** primitives (shadcn pattern) — _to be added as interactive components land_
- **CodeMirror 6** for the JSON editor — _to be ported from `mocktail-dashboard`_
- System / light / dark theming via `data-theme` on `<html>` (`src/lib/theme.ts`)

## Run

```console
yarn install
yarn dev        # http://localhost:3001
yarn build      # → build/  (served by the Go binary, like the old dashboard)
yarn typecheck
```

## Status — first scaffold

Done:
- Vite/TS/Tailwind v4 wired; full OKLCH token system (light + dark) from the handoff.
- Theme system (system/light/dark toggle in the top bar).
- Catalog shell: top bar (logo, status pill, search, Import, + New), left base-path tree,
  center list (method badge · path · status · delay · hits · run), right preview pane.
- Placeholder data in `src/lib/mocks.ts`.

Next:
- Wire to the real API (`/core/v1/*`) instead of placeholder mocks.
- Port stack-agnostic logic from `mocktail-dashboard` (`fakerConfigs`, `applyRandomization`,
  `referenceDetection`, faker/array-analysis hooks).
- Endpoint editor screen (CodeMirror + Data/Headers/Snippets/Test side panel).
- Command palette (`⌘K`), keyboard shortcuts, filter chips.
- Self-host fonts (`src/assets/fonts/README.md`).
- New backend features for v4: hit counts + response headers.
