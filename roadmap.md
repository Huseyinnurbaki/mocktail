# Mocktail Roadmap — Distribution & Polish

Options under consideration for how Mocktail is packaged, distributed, and presented.
Today Mocktail ships as a single self-contained Go binary (serves the API **and** the
React dashboard on `:6625`) plus a Docker image. Everything below builds on that.

---

## Release plan — v4.0

The Workbench redesign ships as **v4.0** (current: 3.1.6). Not because semver *forces* it —
the planned changes are additive and backward-compatible — but because a ground-up UI rebuild
+ new frontend stack + new capabilities is exactly the milestone a major version signals, and
it echoes the v3.0 precedent (the last major).

**Release narrative:** unlike v3.0, which forced a breaking DB migration (export/import to move
data), v4.0 as scoped **breaks nothing** — additive `AutoMigrate` columns, same routes. Headline:
**"v4 — a complete redesign, zero migration required."**

**Scope:** Workbench redesign + Vite migration + response headers. Consider folding
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
mocktail            # starts the server; open http://localhost:6625
```

- **UI:** the full existing dashboard (the binary already serves it) — just in a browser tab.
- **Value over Docker:** removes the Docker dependency entirely. No daemon, ~instant
  start, lighter footprint, one-line install. Aimed at devs who don't have / don't want
  Docker just to run a mock server.
- **Signing:** none needed. CLI binaries aren't Gatekeeper-quarantined → genuinely free.
- **Nice touch:** auto-open the browser on launch (`open http://localhost:6625`).

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

**Resilience / recovery (build with the desktop shell).** Desktop is the only surface where the
*product* owns the backend process, so it must handle a dead/failed sidecar itself — there's no
terminal (CLI: re-run it; Docker: `restart` policy). Three layers:
- **Supervision (automatic).** The Tauri (Rust) shell owns the sidecar lifecycle — Tauri's sidecar
  API gives the child handle + an event stream; on unexpected `Terminated`, **respawn with backoff**
  (e.g. 3× over a few seconds). Most transient crashes self-heal invisibly. Primary mechanism.
- **Manual "Restart server" (desktop-only).** When auto-restart exhausts retries, drop into a
  recovery panel (reuse the red status pill): `[Restart server] [View logs] [Reset data…]`.
  "Restart" = webview `invoke('restart_backend')` → a `#[tauri::command]` that kills the child and
  respawns → pill goes green. Hidden/disabled in browser/CLI builds (the UI can't restart a process
  it didn't spawn). Nuclear option: Tauri `app.restart()` relaunches the whole shell.
- **Reset vs restart.** Restart bounces the process (crashes/hangs); **Reset** wipes/repairs *state*
  for a corrupt or locked SQLite DB — delete/recreate the DB file, gated behind an **"Export first?"**
  prompt (destructive). Depends on the **app-data-dir** item (the shell knows exactly where the DB
  lives).
- **Detection:** the status pill already gives reactive HTTP-reachability for free; the shell should
  *also* listen to the sidecar **process-exit** event so it catches "crashed" faster than "requests
  started failing."
- **⚠️ No orphan processes:** on app quit/restart the shell **must kill the sidecar**, or a headless
  `mocktail` leaks, holds the port, and makes the next launch fail. Classic sidecar footgun — test it.
- **Prevention:** **free-port selection** kills the #1 startup failure (default port already taken) and
  feeds the pill's real port; pairs directly with recovery.

### Both, from one binary

The binary is the product; CLI and desktop are two wrappers around it, so doing both is
incremental, not double work. They coexist in one Homebrew tap:

```console
brew install mocktail                 # formula → CLI (browser UI)
brew install --cask mocktail-desktop  # cask → native window
```

**Shared prep work (benefits both):**
- ✅ Free-port selection done — `MOCKTAIL_PORT=auto`/`0` picks a free port (avoids clashing with the
  Docker version); `MOCKTAIL_PORT`/`PORT` set a fixed one. Desktop shell just sets `MOCKTAIL_PORT=auto`.
- ✅ SQLite DB path resolved via `resolveDBPath()`: **`MOCKTAIL_DB_PATH`** override → OS **app-data
  dir** (`os.UserConfigDir()/mocktail/apis.db`, survives app updates, not CWD-tied) → legacy
  `db/apis.db` fallback (no-HOME/scratch). Docker pins `MOCKTAIL_DB_PATH=/db/apis.db` (compose volume
  unchanged); Makefile `dev-api`/`run` pin `db/apis.db` for local dev. README + compose documented.
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

**Needs backend (additive, backward-compatible — `AutoMigrate` adds a column, existing
`apis.db` upgrades silently, no breaking change):**
- **Response headers** (not request headers) — add optional `Headers datatypes.JSON` (no
  `validate:"required"`, nullable); apply before responding. Flows through import/export
  automatically. *(Request-header matching — conditional responses based on the caller's headers —
  is a separate, bigger feature, NOT in 1a.)*

  **Implementation findings (verified against the code — it mirrors the shipped `Randomize`
  column, so ~80% is a proven copy):**
  - *Model:* the `Api` struct is **defined twice** — `mocktail/mocktail.go` **and** `core/core.go`.
    Add `Headers datatypes.JSON` to **both**. `AutoMigrate` adds the column silently.
  - *CRUD (all easy):* `CreateApi` picks it up via `BodyParser` for free; `UpdateApi` needs one
    line to copy `existingApi.Headers` (like it copies `Randomize`); `ImportApis` needs
    `Headers: importedApi.Headers` in `newApi` (the exact one-liner we just added for Randomize);
    `GetApis` returns it automatically → **import/export work for free**.
  - *⚠️ Content-Type gotcha (the one real subtlety):* `MockApiHandler` ends with
    `c.Status(code).JSON(response)`, and Fiber's `.JSON()` **forces `Content-Type: application/json`**,
    overwriting anything set via `c.Set`. To let a user's custom `Content-Type` win (the headline
    use case — non-JSON / `application/problem+json`), set the headers, then if the user specified a
    `Content-Type`, marshal the body yourself and `c.Send(body)` instead of `.JSON()`. Skip this and
    the feature is half-broken.
  - *Frontend:* add `headers` to `Mock`/`Draft`, map `a.Headers` in `toMock`, include in the
    `saveMock` payload, wire `headers` state + dirty-check + baseline in `Editor.tsx`. The
    `HeadersTab` is currently a stub — needs a real **add/remove key-value rows** editor (~60–80
    lines, straightforward).
  - *Effort:* ~half-day, low risk. Test that a custom `Content-Type` **and** a custom `X-*` header
    both come back on a served mock.

*(Hit counts — a per-mock request counter — was considered and **dropped**: not worth a DB write
per request, and the counter UI added noise without real value.)*

**Frontend-only (data already exists):**
- Base-path tree (derived from `Endpoint`)
- Keyboard shortcuts (`↑↓ ↵ ⌘⏎ ⌘D ⌫ ⌘S ⌘N ⌘E`)
- Dark theme + system/light/dark toggle (not implemented today)
- Inline randomized-field decorations in the editor (today randomize lives in a modal)
- Right preview pane (send + response preview + segmented snippet control)
- Server status pill — ✅ **done** (`TopBar`, reactive off `connected={!error}`, no polling). Now
  reads the **real port from `/health.port`** (fetched once when reachable; falls back to `6625`),
  so it stays correct under `MOCKTAIL_PORT`/`auto`.
- Duplicate mock (`⌘D`)

**Already supported — just reskinned/reorganized (not gaps):** CRUD + methods + status +
delay + JSON body/validation · Randomize/Anonymize/AI faker (20+ types, fixed value, AI prompt,
live preview, apply-all) · snippets (cURL/Node/Python/Go) · import/export · test/send ·
irregular-array support.

The Headers tab is deferrable — the redesign can ship with it stubbed, then fill it in later.

---

## Randomization — status & AI generation (deferred)

**Done (single-field, per-request):** backend generation moved off the client to Go —
`mocktail-api/randomize` (gofakeit, ~24 types + `fixed`, dot-path traversal incl. arrays),
a nullable `Randomize` column (additive/backward-compatible), generation applied in
`MockApiHandler` **per request** (design's true intent, not client-side bake), a
`POST /core/v1/preview` endpoint, and the Data-tab UI (per-field pickers → config → preview →
save) with inline editor decorations (tinted line + `⟳ type` label).

**Remaining randomize follow-ups:** array-multiply (`repeat N` items — high value for list
endpoints, MCP only bakes static), enum/pick (weighted), and full irregular-array field discovery.

**Anonymize — not a separate feature.** Generation *is* anonymization: pick a generator for a
field (frozen-once via the "Regenerate on every request" toggle = a baked fake) and you've
replaced a real value with a safe fake. Rather than build a distinct whole-body scrub + auto-detect
+ backend endpoint, the Data tab now carries a short explainer that frames the existing generators
as the anonymization path ("paste a real response and swap names/emails/IDs for safe fakes"). Good
enough; revisit a one-click whole-body auto-detect only if users ask.

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
middleware already sees every `/mocktail/*` request and would capture the generated randomize
output per request.

**Frontend:** a new top-level **Live** view (peer of the catalog), or a tab — a virtualized
append-only list subscribed to the stream. Relates to the deleted backlog's *Request History* /
*Mock Analytics* ideas.

*Consideration:* streaming/retaining request bodies has memory/PII implications — cap the
in-memory ring buffer and make retention/redaction configurable (env), consistent with the
existing CORS/API-key config style.

**Status — built so far:** the Live view exists with method/status/path/latency/timestamp rows
(newest-first, `/mocktail`-only), pause/resume, clear, and a right-hand **response-body** detail
pane. Now also: **filter bar** (multi-select method chips + 2xx/3xx/4xx/5xx status-class chips +
a **searchable path dropdown** — exact paths seen *plus* auto-derived `/prefix/*` wildcards that
group ≥2 paths, matched by prefix; AND across / OR within), a **300-item display cap** (pill shows
`300+`), and **memoized rows** so each 1.5s poll only re-renders changed rows. Polling stops on close (view
unmounts). **Remaining:** (1) true streaming (SSE/WS) to replace polling — *deferred; polling-while-
open is acceptable*; (2) **request-side detail** — `LogEntry` captures nothing about the request
(no headers / query / body); needs backend capture + UI; (3) **retention/redaction config** (PII) —
pairs with #2; (4) narrow-width fallback for the detail pane (part of the responsiveness pass);
(5) show served response headers once that feature lands. True list virtualization deferred — the
300 cap + memoized rows suffice at this size.

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

**Gotchas (small):** ✅ **done** — the two uppercase `db.Where("ID = ?", ...)` queries
(`core.go:99,149`) are now lowercased to `db.Where("id = ?", id)` (matches the existing
`Where("key = ?")` style; unambiguous and PG-portable). PK auto-increment + unique `Key` are
portable. Still **to do:** the driver-select itself, then run the backend test suite against a real
Postgres (Docker service) to catch any remaining `jsonb`/auto-increment/constraint quirks.

**Bonus — go CGO-free — ✅ DONE.** Swapped `gorm.io/driver/sqlite` (CGO `mattn/go-sqlite3`) →
**`ncruces/go-sqlite3/gormlite`** (pure Go, WASM/wazero). One-line dialector change in `main.go`
(`gormlite.Open("db/apis.db")`), `go mod tidy` dropped `mattn`/`driver-sqlite`. Dockerfile now
`CGO_ENABLED=0` with **no `gcc`/`musl-dev` and no static-link flags**; CI pins `CGO_ENABLED=0`.
Verified: pure-Go build, `go vet`/`go test` green, the new driver **reads the existing CGO-written
`apis.db` unchanged** (no migration), and it **cross-compiles cleanly to darwin/{arm64,amd64},
linux/{amd64,arm64}, windows/amd64** from one machine — the desktop-multiarch unlock. (Binary ~37 MB,
a bit larger than CGO — the expected wasm tradeoff.) Original analysis kept below for context.

- **Driver choice:** prefer **`ncruces/go-sqlite3` + its first-party `gormlite` driver** (SQLite
  compiled to WASM, run via the pure-Go `wazero` runtime; actively maintained, first-party GORM
  support, behavior closest to upstream SQLite). Fallback: **`glebarez/sqlite`** (a thin GORM shim
  over `modernc.org/sqlite`, which transpiles SQLite C → Go). Both are genuinely CGO-free; ncruces
  has the better-maintained, single-owner engine+driver story.
- **What it buys (be precise):** *not* a smaller image — the final stage is already `FROM scratch`,
  and pure-Go SQLite is if anything slightly **larger** than the C. The wins are a **simpler,
  faster, less fragile build** (drop the C toolchain install + static-link flags; no C compile
  step) and — the real prize — **trivial cross-compilation**: every target becomes a plain
  `GOOS=… GOARCH=… go build` from one machine, no per-OS C cross-toolchain. That's what unblocks
  cheap **desktop/CLI multi-arch** binaries via GoReleaser.
- Pair "add Postgres" with "drop CGO" (Postgres' driver is already pure Go, so SQLite is the only
  thing forcing CGO).

**Migration & ops:** SQLite→Postgres data move isn't automatic, but the built-in **export/import
JSON** is the path. Add an optional `postgres` service to `docker-compose.yml`.

---

## Testing & CI

**Current reality (verified):** the only Go test is `randomize/randomize_test.go`. There are **no
tests for the HTTP handlers** (`core` CRUD/import, `MockApiHandler`) and **no UI tests**. The
existing workflows (`docker-onpublish.yml`, `dockerize.yml`, `npm-publish.yml`, `npm-onpublish.yml`)
are all **publish-triggered** — **nothing runs on push/PR**, so a broken build or handler can land
on `master` unnoticed.

### Backend API tests — ✅ built (SQLite)

Handler tests via Fiber's `app.Test(httptest.NewRequest(...))` against a fresh **in-memory
pure-Go SQLite** (`gormlite.Open(":memory:")`) per test. **14 tests**, all green under
`CGO_ENABLED=0`:
- **`core_test.go` (9):** create+get (ID, endpoint normalization, key, status default), delay-cap +
  status default, invalid-method → 400, duplicate `Key` → 400, update, update-not-found → 404,
  delete, import (imported/skipped counts, **skips existing**, **Randomize survives round-trip**),
  preview applies a `fixed` value.
- **`mocktail_test.go` (5):** serve mock, unknown → 404, custom status (503), `204` → no body,
  per-request `Randomize` (`fixed`) applied to the served body.
- Existing `randomize` unit tests kept.

These are the regression net for the v4 "non-breaking" guarantee (response shapes, import/export
format). **Remaining:** cases for `Headers` once that lands; running the *same* suite against
**Postgres** (below) to surface dialect issues; later array-index/`once` randomize cases.

### CI on every push — ✅ built

**`.github/workflows/ci.yml`** runs on `push` + `pull_request` (all branches), with
`concurrency` cancel-in-progress:
- **Backend job** (`mocktail-api`): `setup-go` (version from `go.mod`) → `go build ./...` →
  `go vet ./...` → `go test ./...`. *(Still CGO — `ubuntu-latest` has gcc; **drop-CGO** will let the
  runner skip the C toolchain and speed this up.)*
- **Frontend job** (`mocktail-ui`): `setup-node@20` + yarn cache → `yarn install --frozen-lockfile`
  → `yarn typecheck` (`tsc --noEmit`) → `yarn build`. (Build + typecheck is the floor; no UI unit
  tests yet.)

Both command sets verified locally green. **Later:** `golangci-lint` + `eslint`, and a UI test
runner (**Vitest** — Vite-native) once the backend API tests (above) and any component tests are
worth wiring in.

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

**Cleanup — ✅ done:** the `PORT` env is wired and the default port moved to a **signature port**.
`main.go`'s `bindListener()` resolves: a **number** → that exact port; **unset** → **`6625`** (the
new default — "MOCK" on a phone keypad, clear of busy `3000`/`4000`/`8080`); **`auto`/`0`** → prefer
`6625`, scan `6626`…`6634`, else any OS-assigned free port (desktop, no terminal). `MOCKTAIL_PORT`
wins, then platform-standard `PORT`. Binds via `net.Listen` + `app.Listener`, logs the actual port,
and **`/health` returns `"port"`**. **Status pill ✅ reads `/health.port`** now (fetched once when
reachable; falls back to `6625`). Everything moved off `4000` → `6625`: Dockerfile `EXPOSE`,
compose `ports`, Vite dev proxy, Makefile, TestTab curl, and all READMEs. ⚠️ **Breaking for existing
users** (bookmarks / `-p 4000:4000` / MCP `MOCKTAIL_URL`) — call it out in the v4 release notes.

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

**Editor interaction — ✅ fixed:** double-click to select a word in the JSON editor appeared
broken. Debugging (console-logged the selection state) showed CM's **native** word-select wasn't
firing in this setup *and* — the real kicker — even when selection was set correctly, it was
**invisible**, so it looked like nothing happened. Two root causes, two fixes:
1. Native word-select suppressed → select the word **explicitly** on `dblclick` via
   `view.state.wordAt(pos)` + `dispatch({ selection })` + `focus()` in `CodeEditor`.
2. The word *was* selected but the **opaque active-line background painted over the selection
   layer** (which sits behind the content), hiding the highlight on the very line you clicked.
   Fixed by making `.cm-activeLine` translucent (`color-mix … / transparent`) and bumping the
   `.cm-selectionBackground` accent mix to ~70% so it's clearly visible.

(The earlier deferred-timer / `e.detail` disambiguation theory was wrong — the field-select
`mouseup` handler was never the cause; it was native-suppression + an invisible highlight.)

---

## Landing page

A marketing / docs landing page for Mocktail, served via **GitHub Pages** from this same repo.

- Excluded from the Docker image for free — the Dockerfile uses explicit `COPY ./mocktail-api`
  / `COPY ./mocktail-dashboard`, so a new top-level folder is never bundled.
- **Option A:** static site in a `docs/` folder → Pages "deploy from branch."
- **Option B:** `landing/` source + a Pages build workflow (fits the existing `.github/workflows/`).
- **Domain:** **`getmocktail.com`** (chosen; register on Cloudflare/Porkbun ~$10–13/yr flat). Using a
  custom domain serves at **root**, so the `/mocktail/` project-page base-path caveat goes away.
  Tagline: **"Mock with Mocktail."** For a future hosted tier, tenant endpoints would live on
  subdomains (`acme.getmocktail.com`) or a dedicated API domain (`mocktail.rest`) — Phase 2.
- **⚠️ `#install` anchor is a contract:** the in-app Settings "update available" badge deep-links to
  `getmocktail.com/#install` (`SITE_URL` in `SettingsModal.tsx`). The landing page **must** have an
  `#install` section covering upgrade steps per install method (brew / Docker / desktop).

---

> The desktop shell and landing page each live as their own top-level folder and stay out
> of the Docker image automatically thanks to the explicit-`COPY` Dockerfile.
