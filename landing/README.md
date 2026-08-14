# landing/

The marketing site for Mocktail — **[getmocktail.com](https://getmocktail.com)** (once the domain
is live). `Mock with Mocktail.`

## Current design
`index.html` is a **single self-contained static page** (no build step, no external requests) — the
warm "pour" direction: an **animated cocktail-glass hero** with floating field-generator "ingredients"
(uuid/email/price…), a **real app-window showcase** (mock list + JSON editor with randomize badges), a
**bento features grid** with embedded mini-UI snippets, a **desktop-first** `#install` section (Desktop
→ Homebrew → Docker, with copy buttons), and a footer. Light + dark, OKLCH tokens shared with the app,
reduced-motion respected. The `#install` anchor is the contract the in-app "update available" badge
links to. (Four earlier explorations — dev-terminal, editorial menu, neo-brutalist — were reviewed;
this hybrid won.)

Deliberately deferred (v1 tradeoffs):
- **System fonts** (the branded Instrument Sans / Geist Mono woff2 aren't inlined here) — the mock
  window uses a system-mono stack. Add the real faces when we self-host them in `landing/`.
- **CSS-drawn app mockup** instead of real screenshots — reproducible and asset-free. Swap in real
  captures (light + dark) from a seeded `demo.json` when ready.
- **No analytics yet.** PostHog (landing-only, public project key, reverse-proxied) per the design in
  `../roadmap.md` → *Landing page → Analytics*. **Never** add analytics to the self-hosted app.
- **Not Astro yet.** The roadmap picks Astro + Tailwind; this v1 is plain HTML to ship something real
  fast. Migrate when it grows past one page (docs/changelog/MDX).

## Deploy (Cloudflare Pages)
Deployed to **Cloudflare Pages** (project `mocktail`, custom domain **getmocktail.com**). Deploys are
**manual and deliberate** — run on a stable release, never automatically on a git tag — so
pre-releases (`vX.Y.Z-rc.N`) never touch the public site or its SEO.

```console
./deploy.sh          # rsyncs landing/, injects the version from version.json, then wrangler deploys
```

`deploy.sh` reads the version from **`version.json`** (the single source of truth) and injects it into
the `SoftwareApplication` JSON-LD, so structured data always matches the release without a hardcoded
`softwareVersion` in `index.html`.

> **⚠️ On each STABLE release, remember:**
> 1. Bump **`landing/version.json`** — `version` + `highlights` (the highlights feed the in-app
>    "update available" tooltip in Settings).
> 2. Run **`./landing/deploy.sh`**.
> 3. Only if the tagline/brand changed: re-render `og.png` and update the GitHub social-preview image.

- Excluded from the Docker image automatically (the Dockerfile `COPY`s only `mocktail-api` / `mocktail-ui`).

## Local preview
```console
open landing/index.html      # it's just a static file
```
