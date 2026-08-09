# Mocktail Roadmap — Distribution & Polish

Options under consideration for how Mocktail is packaged, distributed, and presented.
Today Mocktail ships as a single self-contained Go binary (serves the API **and** the
React dashboard on `:4000`) plus a Docker image. Everything below builds on that.

---

## Release plan — v4.0

The Workbench redesign ships as **v4.0** (current: 3.1.6). Not because semver *forces* it —
the planned changes are additive and backward-compatible — but because a ground-up UI rebuild
+ new frontend stack + new capabilities is exactly the milestone a major version signals, and
it echoes the v3.0 precedent (the last major).

**Release narrative:** unlike v3.0, which forced a breaking DB migration (export/import to move
data), v4.0 as scoped **breaks nothing** — additive `AutoMigrate` columns, same routes. Headline:
**"v4 — a complete redesign, zero migration required."**

**Scope:** Workbench redesign + Vite migration + hit counts + response headers. Consider folding
the CLI formula / desktop app into the same story (as 4.0 or a 4.1 fast-follow) — *"Mocktail v4:
redesigned, and now native."*

**Verify before committing to "non-breaking v4"** (any of these breaking would *force* the major,
and require an MCP bump):
- [ ] `/core/v1/*` response shapes unchanged — the **MCP server** (`mocktail-mcp`) depends on them.
- [ ] Import/export JSON format unchanged — old exports must still import.
- [ ] Routes stable — `/`, `/mocktail/*`, `/core/v1/*`, `/health`.

**Versioned artifacts:** bump dashboard `package.json` (3.1.6 → 4.0.0) and the Docker image
together. The **MCP server** (`mocktail-mcp`, npm) versions independently — bump only if its API
contract changes.

---

## Distribution channels

### CLI formula (Homebrew) — high value, zero friction

Ship the existing Go binary via a Homebrew **formula** so users can:

```console
brew install mocktail
mocktail            # starts the server; open http://localhost:4000
```

- **UI:** the full existing dashboard (the binary already serves it) — just in a browser tab.
- **Value over Docker:** removes the Docker dependency entirely. No daemon, ~instant
  start, lighter footprint, one-line install. Aimed at devs who don't have / don't want
  Docker just to run a mock server.
- **Signing:** none needed. CLI binaries aren't Gatekeeper-quarantined → genuinely free.
- **Nice touch:** auto-open the browser on launch (`open http://localhost:4000`).

### Desktop app — native window + dock icon

A thin **Tauri** (recommended) or **Wails** shell that spawns the *same* Go binary as a
sidecar and points a native webview at it.

- **What it uniquely adds over CLI/Docker:** a dedicated app window, dock icon, no browser
  chrome — a "real app" feel. Functionally the same UI.
- **Recommended:** Tauri with the Go binary as a sidecar (smallest bundle ~5–15 MB, reuses
  the exact existing build; adds a Rust toolchain). Wails is the Go-native alternative.
- **Signing:** unsigned works — one-time "unidentified developer" prompt. Ad-hoc signing
  (`codesign --sign -`, free) avoids the harsher "app is damaged" error on Apple Silicon.
  Apple notarization ($99/yr) only needed to remove the first-launch warning — **optional**.

**Updates.** Unlike the web/Docker/CLI versions (which update via `pull` / `brew upgrade` /
browser-serves-latest), a native app bundle needs an explicit update story. Two paths:

- **Path A — Homebrew as the updater (zero config, free, start here).** Ship the cask; users
  run `brew upgrade --cask mocktail-desktop`. No updater keys, no manifest, no endpoint. Pull-based
  (no background check / in-app prompt), which is fine for a terminal-comfortable audience.
- **Path B — built-in updater (later, if you want in-app "update available" UX).** Tauri's
  `@tauri-apps/plugin-updater`: app checks an endpoint on launch, downloads, verifies, relaunches.
  Config: generate an updater keypair (`tauri signer generate`, free, *separate from OS
  code-signing*), point `tauri.conf.json` at the public key + endpoint, and have CI publish the
  bundles + a `latest.json` manifest (GitHub Releases works as host — no server).
  - *macOS catch:* silent auto-update of an **unsigned** app is finicky (can re-trigger Gatekeeper
    or block the install), so Path B works cleanly only once **notarized** — the two go together.
  - *Wails caveat:* no official updater — a point in Tauri's favor if in-app auto-update matters.
- **Sidecar implication:** each desktop release **repackages the whole bundle** (shell + current
  Go binary) — you don't update the Go binary separately.

**Update strategy:** Path A now → Path B + notarization later, if/when the in-app UX is wanted.

### Both, from one binary

The binary is the product; CLI and desktop are two wrappers around it, so doing both is
incremental, not double work. They coexist in one Homebrew tap:

```console
brew install mocktail                 # formula → CLI (browser UI)
brew install --cask mocktail-desktop  # cask → native window
```

**Shared prep work (benefits both):**
- Free-port selection instead of hardcoded `:4000` (avoids clashing with the Docker version).
- Move the SQLite DB to the OS app-data dir (survives app updates).
- Auto-open behavior (CLI → browser, desktop → its own window).

**Suggested sequencing:**
1. **Phase 1** — binary prep + Homebrew **formula** (fast, free, no signing). Prereq for desktop.
2. **Phase 2** — Tauri desktop shell reusing the phase-1 binary + a **cask** in the same tap.

**Automation:** GoReleaser can build the binary, cut the GitHub release, and auto-update
the Homebrew tap in one pipeline — slots next to the existing `.github/workflows/`.

**Notability note:** an *own tap* works immediately with no approval. Getting into the
official `homebrew-core` / `homebrew-cask` requires a notability bar (stars/forks) — a later goal.

---

## UI glow up — "Workbench" redesign (direction 1a)

Full rebuild of the dashboard UI layer to match the **1a "Workbench"** design
(`design_handoff_mocktail_dashboard/`): catalog (light) + endpoint editor (dark), fluid
from narrow window to wide desktop, OKLCH tokens, system/light/dark themes. Keep the data
model, API, and routes; replace the UI layer.

### Stack decision

Since this is a technical rebuild (not an incremental restyle), it's a greenfield frontend
stack choice — the "avoid a migration" argument for staying on the current libs doesn't apply.

- **Build tool: migrate CRA (`react-scripts`) → Vite.** Unconditional. CRA is unmaintained
  (the `NODE_OPTIONS=--openssl-legacy-provider` hack in the Dockerfile is a symptom); Vite is
  faster, cleaner, and **Vite-native tooling is what Tauri expects** — so this also de-risks
  the desktop app. Update the `builder-dashboard` Docker stage and the `REACT_APP_*` →
  `import.meta.env.VITE_*` env prefix.
- **Component layer: go CSS-first + headless** (recommended), because 1a is authored in raw
  CSS terms (OKLCH token tables, exact px/radii) and is mostly custom layout, not stock
  components — so what's needed is headless interactive primitives, not a batteries-included
  styled-component lib.
  - **Primary:** Vite + **Tailwind v4** (CSS-first `@theme` maps 1:1 to the OKLCH token table)
    + **Radix** primitives (shadcn/ui pattern).
  - **Low-churn alternative:** Vite + **Ark UI** (the same headless engine under Chakra v3) +
    **CSS Modules** — hand-written CSS, minimal new mental model.
  - **Staying on Chakra v3** is defensible only if familiarity/velocity outweighs fit.
- **Keep** CodeMirror 6 (already framework-agnostic). **Self-host** the fonts (Instrument Sans
  UI, Geist Mono code) so the desktop build works offline.

### Repo layout & rebuild strategy

The rebuild lands in a **new parallel directory `mocktail-ui/`** (Vite + React + Tailwind v4 +
Radix), built alongside the current `mocktail-dashboard/` so the old UI keeps building/shipping
until parity. Named `mocktail-ui` (not `-web`) because it's the single UI shared by every surface
(browser, desktop webview, CLI) — desktop is a separate `mocktail-desktop/` wrapper, not its own UI.

Repo layout:
- `mocktail-api/` — Go backend + binary
- `mocktail-ui/` — dashboard (new; replaces `mocktail-dashboard/`)
- `mocktail-desktop/` — Tauri/Wails native shell (loads the `mocktail-ui` build + Go sidecar)
- `mcp-server/` — MCP integration
- `landing/` or `docs/` — marketing site → GitHub Pages

**Port-then-retire:** move stack-agnostic logic across (`fakerConfigs`, `applyRandomization`,
`referenceDetection`, the faker/array-analysis hooks); throw away only the view layer.

**Cutover** (one commit, when `mocktail-ui` hits parity):
- [ ] Dockerfile `builder-dashboard`: `COPY ./mocktail-dashboard` → `./mocktail-ui`
- [ ] Makefile dev/build targets
- [ ] `.dockerignore` path
- [ ] `readme.md` dev-setup references
- [ ] `git rm -r mocktail-dashboard`

Until then, Docker stays pointed at the old dir.

### Feature gaps vs. current app

Verified against the Go `Api` model and dashboard `src`. Functionally ~85% is already there —
1a is mostly a reskin/relayout of existing capability. Genuinely new:

**Needs backend (both additive, backward-compatible — `AutoMigrate` adds columns, existing
`apis.db` upgrades silently, no breaking change):**
1. **Hit counts** — add `Hits int \`gorm:"default:0"\`` to the `Api` struct; increment
   atomically in `MockApiHandler` (`db.Model(&api).UpdateColumn("hits", gorm.Expr("hits + 1"))`);
   already returned by `GetApis`. Powers the `hits` column + status-pill counts. *Caveat:* a DB
   write per mock request — fine for dev/testing; if load-tested, flush an in-memory counter
   periodically instead of writing per-request.
2. **Response headers** (not request headers) — add optional `Headers datatypes.JSON` (no
   `validate:"required"`, nullable); apply via `c.Set(k, v)` before responding; let user headers
   win over the default `Content-Type`. Flows through import/export automatically. *(Request-header
   matching — conditional responses based on the caller's headers — is a separate, bigger feature,
   NOT in 1a.)*

**Frontend-only (data already exists):**
- Base-path tree (derived from `Endpoint`)
- Command palette (`⌘K`)
- Keyboard shortcuts (`↑↓ ↵ ⌘⏎ ⌘D ⌫ ⌘S ⌘N ⌘E`)
- Dark theme + system/light/dark toggle (not implemented today)
- Filter chips (Method / Status) + "Failing mocks only" saved filter
- Inline randomized-field decorations in the editor (today randomize lives in a modal)
- Right preview pane (send + response preview + segmented snippet control)
- Server status pill (`/health` exists; needs UI + surfaced port)
- Duplicate mock (`⌘D`)

**Already supported — just reskinned/reorganized (not gaps):** CRUD + methods + status +
delay + JSON body/validation · Randomize/Anonymize/AI faker (20+ types, fixed value, AI prompt,
live preview, apply-all) · snippets (cURL/Node/Python/Go) · import/export · test/send ·
irregular-array support.

Both backend items are deferrable — the redesign can ship with the hits column and Headers tab
stubbed, then fill them in.

---

## Randomization — status & AI generation (deferred)

**Done (single-field, per-request):** backend generation moved off the client to Go —
`mocktail-api/randomize` (gofakeit, ~24 types + `fixed`, dot-path traversal incl. arrays),
a nullable `Randomize` column (additive/backward-compatible), generation applied in
`MockApiHandler` **per request** (design's true intent, not client-side bake), a
`POST /core/v1/preview` endpoint, and the Data-tab UI (per-field pickers → config → preview →
save) with inline editor decorations (tinted line + `⟳ type` label).

**Remaining randomize follow-ups:** array-multiply (`repeat N` items — high value for list
endpoints, MCP only bakes static), enum/pick (weighted), Anonymize (paste real response → fake
it, a one-shot edit-time transform), and full irregular-array field discovery.

**AI field generation — deferred, UI present but disabled.** The `✨ AI prompt` option shows in
the generator dropdown (so the capability is discoverable) but is **disabled** until wired.
Design when we build it:
- **Config via env** (self-hosted pattern, like `MOCKTAIL_API_KEY`/CORS): `MOCKTAIL_AI_API_KEY`,
  `MOCKTAIL_AI_PROVIDER` (default `anthropic`), `MOCKTAIL_AI_MODEL` (provider-specific default, e.g.
  a cheap/fast Claude Haiku). No key → feature stays off. A settings-UI field can come later.
- **Pluggable providers.** Generation sits behind a small provider interface so backends swap via
  config, never code changes:

  ```go
  type Provider interface {
      Generate(ctx context.Context, prompt string, opts Options) (string, error)
  }
  ```

  A registry maps `MOCKTAIL_AI_PROVIDER` → constructor; model comes from `MOCKTAIL_AI_MODEL`.
  Planned rollout order:
  1. **Anthropic** (Claude) — default, ships first.
  2. **OpenAI** (GPT).
  3. **Google Gemini**.
  4. More on demand (local/Ollama, Mistral, …).

  The frontend stays provider-agnostic — it asks the backend to "generate"; provider/model are a
  server concern (optionally surfaced read-only in settings). Both AI entry points below share this
  one provider layer.
- **Bake-once, not per-request:** a "Generate with AI" action calls the LLM **once** at edit time
  and stores the value statically — avoids an LLM call (cost/latency/rate-limit) on every mock
  request. Per-request AI is the anti-pattern to avoid.
- Config already round-trips (`type: "ai"` + `prompt` stored on the mock); only backend generation
  is missing. Until then AI fields serve the literal body value.

**AI-dependent UI already stubbed (disabled + beta, unlock when AI is wired):**
- **Per-field `✨ AI prompt`** in the generator dropdown.
- **`✨ AI JSON`** action next to Format in the editor — describe the response in natural language
  and have AI build the whole body (bake-once). Same env-config + bake-once model as above.

---

## Live traffic page (request/response observability)

A live view that streams every request hitting the mock endpoints as it happens — for
debugging client integrations without leaving the dashboard.

**What it shows**, newest-first, updating in real time:
- method · path · status · latency · timestamp
- per-row expand: request (headers, query, body) and the exact response served (incl. any
  per-request randomized values that were generated)
- filters by method/status/path; pause/resume; clear

**Backend:** builds on the existing logging foundation — the request-logging middleware in
`main.go` and `GET /core/v1/logs` / `DELETE /core/v1/logs` (the old dashboard's Logs tab).
For true "live", add a stream (SSE `GET /core/v1/logs/stream`, or WS) instead of polling; the
middleware already sees every `/mocktail/*` request. Pairs naturally with the v4 **hit counts**
(same request hook) and would capture the generated randomize output per request.

**Frontend:** a new top-level **Live** view (peer of the catalog), or a tab — a virtualized
append-only list subscribed to the stream. Relates to the deleted backlog's *Request History* /
*Mock Analytics* ideas.

*Consideration:* streaming/retaining request bodies has memory/PII implications — cap the
in-memory ring buffer and make retention/redaction configurable (env), consistent with the
existing CORS/API-key config style.

---

## Database — Postgres as an alternative (SQLite stays default)

**Analysis: low effort.** The DB layer is pure GORM with **no raw/dialect SQL** (grepped —
no `Raw`/`Exec`), a single open site (`main.go`), and `datatypes.JSON` (→ `TEXT` on SQLite,
`jsonb` on Postgres). GORM emits per-dialect DDL via `AutoMigrate`.

**What it takes:**
- Add `gorm.io/driver/postgres`.
- Replace the one `gorm.Open(sqlite.Open(...))` with a driver-select: if `MOCKTAIL_DATABASE_URL`
  (Postgres DSN) is set → `postgres.Open(dsn)`, else default SQLite (~15 lines). SQLite stays the
  **zero-config default**; Postgres is **opt-in**.
- `AutoMigrate` handles schema on both — no migration scripts.

**Gotchas (small):** normalize the two uppercase `db.Where("ID = ?", ...)` queries
(`core.go:99,149`) to `db.First(&api, id)` — works in PG via lowercasing but fragile. PK
auto-increment + unique `Key` are portable.

**Bonus — go CGO-free.** SQLite currently uses the **CGO** driver (Dockerfile installs
`gcc`/`musl-dev`, `CGO_ENABLED=1`, static-link dance). Swapping to a pure-Go SQLite driver
(`glebarez/sqlite`, drop-in) makes **both** drivers pure Go → `CGO_ENABLED=0`, simpler/smaller
Docker build, and trivial **cross-compilation** — which directly helps the **desktop multi-arch**
binaries. Pair "add Postgres" with "drop CGO."

**Migration & ops:** SQLite→Postgres data move isn't automatic, but the built-in **export/import
JSON** is the path. Add an optional `postgres` service to `docker-compose.yml`.

---

## Security posture & hardening

**Current reality (verified in `main.go`):**

| Surface | Securable in-app today? | How |
|---|---|---|
| `/mocktail/*` (served mocks) | ✅ Yes | `MOCKTAIL_API_KEY` (`X-API-Key` / `?api_key=`) |
| `/core/v1/*` (management CRUD, import, preview, logs) | ❌ No | *(nothing — no middleware)* |
| `/` (dashboard) | ❌ No | *(nothing)* |

- `apiKeyMiddleware` is applied **only** to the `/mocktail/*` group, never to `/core/v1/*`.
- **The MCP `MOCKTAIL_API_KEY` is a no-op**: `mcp-server` sends `X-API-Key` on every call, but its
  tools hit `/core/v1/*`, which doesn't check it. MCP *functionality* works regardless (core API is
  open); the key just doesn't secure anything on that path.
- Protecting core/dashboard today is **external only** (firewall / VPN / reverse-proxy auth).

**Decision — no in-app API-key settings UI.** Desktop = localhost (moot); container = operator sets
`MOCKTAIL_API_KEY` via env (correct model, not dashboard-changeable). A UI to set it would be
security theater while the core API is open, and would expose the secret to anyone opening the
(unauthenticated) dashboard. Keep the AI-provider "API keys" tab separate — that's an *outbound*
secret, unrelated to inbound access control.

**Hardening (only if a shared/public hosted instance ever becomes a goal):** apply key middleware
to the `coreApi` group + have the dashboard send the key (prompt once → localStorage); MCP already
sends it, so this also makes the MCP key *real*. Either reuse `MOCKTAIL_API_KEY` or add a separate
`MOCKTAIL_ADMIN_KEY` for management vs serving. Not needed for desktop or a firewalled container.

**Cleanup:** `PORT` env var is **dead** — referenced only in a commented line (`main.go:101`); the
listen addr is hardcoded `:4000` (`main.go:184`). Wire it up (or a free-port pick) — also a
prerequisite for the desktop free-port plan.

---

## AI assistant (embedded)

An in-app assistant that both **does things** (agentic) and **teaches** ("how does X work"),
surfaced as a **tab in the catalog's right panel** (Preview | ✨ Assistant) and — later — as an
**AI tab in the editor** (scoped to the open mock, replacing the stubbed `✨ AI JSON` button).

**Tiered by cost/complexity:**
- **Pre-baked FAQ — built.** Curated question → canned answer, no LLM/key/backend/DB. Ships now,
  validates the shell. (`components/catalog/AssistantPanel.tsx`.)
- **Free-form chat — gated behind a user API key (BYO).** Needs the pluggable provider wired; the
  input is disabled with "Add an API key to chat" → Settings → API keys. **No DB** — chat is
  ephemeral (React state, optionally localStorage per session), never the mock DB.

**Agentic side (later):** reuse the **MCP tool schemas** (`create/update/delete/import/list`) as the
assistant's toolset so it can create/edit mocks from natural language — the in-app, no-external-Claude
version of MCP, with the catalog updating live as it works. Needs the provider's tool-use support
(varies per provider) + confirm-before-destructive.

**Staging:** provider (text) → Q&A/chat → tools. See the pluggable-provider design under the
Randomization section. Not a weekend feature once tools/streaming are in scope; the FAQ + chat-shell
is the shippable slice (done / gated).

**Performance (hard constraint — long transcripts must stay cheap):** a growing chat is the classic
RAM/render trap (every message + big block stays mounted). Build with: (1) **virtualized message
list** (render only on-screen messages) — the single biggest fix; (2) **bounded transcript** (ring
buffer, ~100 msgs, older behind "load earlier"); (3) **collapse large blocks** (reuse ResponseView's
`+N lines`); (4) **batched streaming** (buffer tokens, flush on rAF, re-render only the streaming
message); (5) **memoized messages** + stable keys; (6) keep strings, not heavy parsed objects, in
state. Already helping: CodeMirror is line-virtualized (big responses cheap); Live is bounded by the
500-entry log buffer. Next virtualization candidates if data grows: the catalog list and Live list.

---

## Final responsiveness check (pre-ship)

The redesign was built desktop-first; before shipping v4, do a responsive pass against the 1a
breakpoints. Current state uses hard `lg:`/`xl:` show-hide with **no narrow-width fallbacks**, so
several panels simply disappear on smaller screens — that's the gap to close.

**Known gaps (build the fallbacks):**
- **Left tree** is `hidden lg:flex` → below `lg` it vanishes with no way back. 1a wants it to become
  an **overlay drawer** (hamburger in the top bar) at 780–1100px.
- **Right panel** (Preview/Assistant) is `hidden xl:flex` → gone below `xl` with no fallback. 1a hides
  the preview 1100–1280, but the **Assistant** still needs a route in (a tab/toggle) on narrow.
- **Editor side panel** (Data/Headers/Test) is `hidden lg:flex` → **disappears below `lg`**, so
  randomize/test are unreachable on small screens. 1a wants it as a **bottom sheet** < 1100px, and
  tabs stacked above the editor < 780px.
- **Live view** detail is `hidden lg:flex` — same "no fallback" issue.

**Verify across widths (≥1280 · 1100–1280 · 780–1100 · <780):**
- [ ] No horizontal scrolling at any width (per 1a — hits/delay columns drop first).
- [ ] Catalog: tree drawer, list full-width, search moves full-width under the top bar < 780.
- [ ] Editor: request bar wraps to two rows; side panel → bottom sheet; tabs stack.
- [ ] Right panel: Assistant reachable when the preview is hidden.
- [ ] Overlays (editor, settings, live, context menu, dropdowns) fit + reposition on small viewports.
- [ ] Portaled menus (generator, status, context) clamp to viewport (status/generator already clamp).
- [ ] Touch targets ≥ ~40px; hover-only affordances have a tap equivalent.
- [ ] Both themes at each width.

Once these fallbacks exist and pass, the redesign is ship-ready for v4.

**Editor interaction — known issue:** double-click to select a word in the JSON editor doesn't
work. Almost certainly the field-select `mouseup` handler in `CodeEditor` (resolves the clicked
field → opens the Data tab) interferes with CodeMirror's native word/line selection on the second
click. Fix: ignore multi-click in the handler (`if (e.detail > 1) return`) or only fire field-select
on a single click, so double/triple-click keep CM's word/line selection.

---

## Landing page

A marketing / docs landing page for Mocktail, served via **GitHub Pages** from this same repo.

- Excluded from the Docker image for free — the Dockerfile uses explicit `COPY ./mocktail-api`
  / `COPY ./mocktail-dashboard`, so a new top-level folder is never bundled.
- **Option A:** static site in a `docs/` folder → Pages "deploy from branch."
- **Option B:** `landing/` source + a Pages build workflow (fits the existing `.github/workflows/`).
- Mind the project-page base path (`/mocktail/`) for absolute asset URLs, unless a custom domain is set.

---

> The desktop shell and landing page each live as their own top-level folder and stay out
> of the Docker image automatically thanks to the explicit-`COPY` Dockerfile.
