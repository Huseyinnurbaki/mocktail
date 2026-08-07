# Fonts (self-hosted)

The design uses **Instrument Sans** (UI) and **Geist Mono** (code/paths/numbers). Self-host
them so the desktop build works offline (no Google Fonts request).

1. Drop the `.woff2` files here (e.g. `InstrumentSans-{400,500,600}.woff2`, `GeistMono-{400,500,600}.woff2`).
2. Add matching `@font-face` rules to `src/index.css`, e.g.:

```css
@font-face {
  font-family: "Instrument Sans";
  src: url("./assets/fonts/InstrumentSans-400.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
```

Until then the UI falls back to `system-ui` / `ui-monospace`, which is fine for development.
