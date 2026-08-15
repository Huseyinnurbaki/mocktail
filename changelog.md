# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)

## [4.0.3] - 2026-08-15

Assistant bug fixes.

### 🐛 Fixed

- The **AI assistant can now set custom response headers** on create/update (e.g.
  `X-Mock-Source: Mocktail`) — the `create_mock`/`update_mock` tools were missing the `headers`
  parameter, so the assistant would say it couldn't add them.
- **Catalog no longer shows a stale list** right after the assistant creates or edits a mock — the
  management API is now served with `Cache-Control: no-store`, so the browser can't return a cached
  list (previously the new mock only appeared after a manual refresh).

## [4.0.2] - 2026-08-14

UI polish and clearer AI-key guidance.

### ♻️ Changed

- Clearer AI-key guidance in **Settings → API keys** for Docker/remote deployments: native (binary)
  instances store the key in the OS keychain; containerized or remote ones take it as an env var.
- Removed the disabled **"AI prompt"** placeholder from the field-generator dropdown (it returns when
  AI field generation is wired).
- Dropped the decorative sparkle icons from AI-related UI.

## [4.0.1] - 2026-08-14

A small follow-up to 4.0.0 — fixes AI key setup for containers/remote dashboards and lays the
per-provider groundwork for future AI providers.

### 🐛 Fixed

- **AI key setup on containers / remote dashboards.** Setting a key from a non-local session no
  longer shows an input that then fails with a 403. Settings → API keys now detects the session and
  points you at the environment variable instead.

### ♻️ Changed

- **AI keys and endpoint overrides are now per provider.** Use `MOCKTAIL_AI_API_KEY_ANTHROPIC` (and
  `MOCKTAIL_AI_BASE_URL_ANTHROPIC` to route through an AI gateway/proxy), with `_<PROVIDER>` for
  future providers. The generic `MOCKTAIL_AI_API_KEY` / `MOCKTAIL_AI_BASE_URL` still work as
  **deprecated** fallbacks. Stored keys are scoped per provider (keychain `apikey-<provider>`, file
  `ai_key_<provider>`).

### ⬆️ Upgrading

- **Re-enter your AI key** if you saved one in Settings on 4.0.0 — the keychain slot moved
  (`apikey` → `apikey-anthropic`), so the app shows no key until you paste it again (it validates
  instantly). Setting the key via an environment variable is unaffected.

## [4.0.0] - 2026-08-14

The biggest release yet — a full dashboard redesign, an in-app AI assistant, response headers, a
live traffic view, and a CGO-free build. **Note the breaking port change below.**

### ⚠️ Breaking

- **Default port is now `6625`** (was `4000`) — Mocktail's signature port ("MOCK" on a phone
  keypad), clear of the busy `3000`/`4000`/`8080` range. Update bookmarks, `-p 6625:6625` Docker
  mappings, and the MCP `MOCKTAIL_URL`. Set `MOCKTAIL_PORT` to override; `auto` scans for a free port.

### ⬆️ Upgrading from v3.x

- **Docker:** just pull `4.0.0` and recreate — your mounted volume is unchanged, so mocks persist.
- **Everything else:** the SQLite file moved to the OS app-data dir, so the simplest, guaranteed path
  is **Export → Import**: in v3, **Settings → Export** your mocks to JSON; after upgrading, **Settings
  → Import** them into v4. (Existing paths are skipped on import, so it's safe to re-run.)

### ✨ Added

- **AI assistant (in-app, agentic)** — a dashboard assistant that answers questions about Mocktail
  and your own mocks, and can **create / update / delete** endpoints from natural language, with the
  catalog updating live. Bring your own key; it's stored in the OS keychain and used **server-side
  only** — never in the browser. Pluggable provider layer (Anthropic first). Reads your mocks only
  when asked (`list_mocks` / `get_mock` tools). `/this` targets the selected endpoint.
- **Response headers** — set custom headers per mock (including a `Content-Type` override, e.g.
  `application/problem+json`). Shown in the Test tab, Live view, and Preview; carried through import/export.
- **Live traffic view** — a filterable stream of real requests hitting your mocks (method / status /
  path, with `/prefix/*` wildcards), served response + headers, and arrow-key navigation.
- **Themes & accents** — light / dark / system with selectable accent colors.
- **Inline search completion** — type a path in the catalog search and press Tab to drill base-path
  segments; keyboard shortcuts throughout (`⌘F`/`⌘E`/`⌘L`/`⌘O`/`⌘↵`/`⌘D`, `↑↓`, `↵`).
- **`MOCKTAIL_ADMIN_KEY`** — optional auth on the management API (`/core/v1/*`). Tri-state:
  unset (open) · `<value>` · `auto` (random per launch). `/` and `/health` stay open.
- **`MOCKTAIL_PORT`** — set a fixed port, or `auto` to prefer `6625` then scan for a free one;
  `/health` now reports the bound port.
- **Backend test suite + CI** — handler, logger, AI-tool (with abuse/guardrail tests), and
  DB/startup integration tests, run on every push via GitHub Actions.

### ♻️ Changed

- **Dashboard fully rebuilt** — migrated from Chakra UI to **React + Tailwind CSS v4** (OKLCH tokens),
  Vite build, CodeMirror 6 editor. New catalog, editor, live, and settings surfaces; responsive.
- **CGO-free build** — SQLite now uses the pure-Go `ncruces/go-sqlite3` driver (`CGO_ENABLED=0`),
  simplifying cross-compilation. (Building the image yourself needs Docker ≥ 4 GB.)
- **Database location** — the SQLite file now lives in the OS per-user app-data dir by default
  (survives updates, not tied to the working directory). Docker still uses `/db/apis.db`; override
  anywhere with `MOCKTAIL_DB_PATH`.
- **Settings** — grouped Help/FAQ, API-keys tab, GitHub link, and an update-available check.

## [3.1.9] - 2026-06-03

### 🔒 Security

- **Backend:** Upgraded `golang.org/x/crypto` from `v0.47.0` to `v0.52.0` (fixes CVE-2026-46595, CVE-2026-39834, CVE-2026-39833, CVE-2026-39832, CVE-2026-39831, CVE-2026-39830, CVE-2026-42508, CVE-2026-39829, CVE-2026-46597)
- **Backend:** Upgraded `golang.org/x/net` from `v0.49.0` to `v0.55.0` (fixes CVE-2026-39821)

## [3.1.8] - 2026-03-20

### 🔒 Security

- **Backend:** Upgraded `github.com/gofiber/fiber/v2` from `v2.52.9` to `v2.52.12` (fixes CVE-2025-66630, CVE-2026-25882)
- **Backend:** Upgraded Go toolchain from `go1.24.12` to `go1.26.1` (fixes CVE-2026-25679, CVE-2026-27142, CVE-2026-27139)

## [3.1.6] - 2026-03-02

### 🔧 Fixed

- **Backend & MCP:** Endpoint paths with any number of leading slashes are now stripped on both write (create/update/import) and read (request lookup), preventing `/mocktail//posts/1`-style double-slash URLs

## [3.1.5] - 2026-03-02

### 🔧 Fixed

- **MCP:** Endpoint paths are now normalized — leading double slashes and any `//` within the path are collapsed to a single `/` before storing
- **MCP:** `MOCKTAIL_URL` trailing slashes are stripped, preventing malformed URLs when the env var includes a trailing slash

### ✨ Added

- **Catalog:** Pagination — the endpoint list paginates when it exceeds a page; Previous/Next controls are shown only when there is more than one page

## [3.1.4] - 2026-02-22

### ✨ Added

**MCP Server — AI Integration**
- MCP protocol support — manage mock endpoints from AI assistants like Claude via natural language
- 5 tools: `list_mocks`, `create_mock`, `update_mock`, `delete_mock`, `import_mocks`
- Published to npm as `mocktail-mcp` — install with `npx mocktail-mcp`, no build required
- Setup instructions for Claude Code and Claude Desktop
- Automated npm publishing via CI/CD (dev tag on push, latest tag on release)

**Randomize & Anonymize — Custom & AI Generate Types**
- **Custom type** - Enter a fixed value applied to all matching fields; always enforces "apply same value to all"
- **AI Generate type** - Write a natural language prompt; embedded provider/model selector (OpenAI, Anthropic, Google) in compact header bar
- "Apply same value to all" checkbox — generate once and reuse the same value across all array items
- Auto-checks "Apply same value to all" when user enables "Apply to all" while Custom type is selected

**Randomize & Anonymize — UX Overhaul**
- Three-column layout: JSON tree (left) | config & options (center) | type selector (right)
- Type selector redesigned as a scrollable grouped list with sticky category headers and icons
- Selected row highlighted (blue) in JSON tree for clear navigation
- Expanded tree nodes at any depth — no longer limited to top two levels
- Checkboxes and Reset button only appear after a type is selected (cleaner empty state)
- Modal width increased to 1400px for comfortable three-column layout

**Create Tab**
- Delay field removed from Create tab; defaults to 0ms automatically
- Delay remains configurable per-endpoint in the Catalog tab

### 🔧 Fixed
- Reset button no longer adds a "configured" green badge — correctly discards the config entry
- Clicking a field no longer auto-assigns a type (no more spurious green badges on click)
- First-click highlight bug in JSON tree: bracket notation (`[0]`) and dot notation (`.0.`) paths now correctly normalized before comparison
- Nested objects (e.g., `links`) now show expand arrow and are expandable at all tree depths

### 🎨 Improved
- PreviewBox redesigned with left-accent bar and subtle blue background (consistent with overall style)
- Checkboxes replaced with `CheckRow` component — custom styled, compact, with blue fill on checked state
- "Apply to all" and "Apply same value to all" grouped in single bordered card with divider
- Review modal cards are now single-row (path + type badge inline) for compact display
- Review modal: Apply Changes on left, Close on right

## [3.1.3-alpha] - 2026-02-03

### ✨ Added

**Backend Logs Tab (New)**
- Split-view interface: request list on left, full details on right
- Click any request to inspect full response body
- Pretty-printed JSON with automatic formatting (2-space indentation)
- Method badges color-coded by HTTP verb (GET=green, POST=blue, PUT=orange, DELETE=red)
- Status badges color-coded by range (2xx=green, 3xx=blue, 4xx=orange, 5xx=red)
- Real-time monitoring with 2-second auto-refresh
- Auto-pause when browser tab is hidden (performance optimization)
- Copy/download individual responses as JSON files
- Structured logging: stores method, path, status, duration, and full response
- In-memory buffer keeps last 500 requests
- Smart filtering excludes polling endpoints from display

**Enhanced Code Examples**
- API key input field with masked display (******* by default)
- Show/hide toggle (eye icon) for API key visibility
- Copy button always includes actual API key (not masked)
- Code examples dynamically include X-API-Key header when set
- Works for all languages: cURL, Node.js, Python, Go
- Read-only display (configure via REACT_APP_MOCKTAIL_API_KEY env var)

### 🔧 Fixed
- **Critical:** String mutation bug causing request paths to corrupt (e.g., /mocktail/users → /core/v1/logsa)
- Root cause: Fiber's internal string buffers were being shared across requests
- Solution: Use `strings.Clone()` to force new string allocations in Go logger
- Double string copying at middleware and logger levels ensures complete isolation
- Deep copying on frontend prevents React state mutation
- Request list properly scrollable with fixed height
- Response viewer has fixed height with scroll (doesn't expand layout)
- Clear All now clears both request list and selected details panel
- Excluded /core/v1/apis and /core/v1/logs from request logs (polling endpoints)

### 🎨 Improved
- Response JSON automatically pretty-printed for readability
- Terminal-style dark theme for response viewer
- Auto-selects most recent request on page load
- Request list shows newest first (reverse chronological)
- Duration formatting (milliseconds for <1s, seconds for longer)


## [3.1.2-alpha] - 2026-02-03

### ✨ Added

**Security & Configuration**
- API key authentication for mock endpoints (MOCKTAIL_API_KEY)
- Dashboard and Core API automatically exempt from API key requirement
- Supports both X-API-Key header and ?api_key=... query parameter
- .env file support for local development (uses godotenv)
- Startup logging shows all configuration with masked API key

**Dependencies**
- Updated golang.org/x/crypto to v0.47.0 (fixes CVE-2024-45338)
- Updated golang.org/x/net to v0.49.0 (fixes CVE-2023-45288)
- Updated golang.org/x/sys to v0.40.0
- Added github.com/joho/godotenv v1.5.1

### 🔧 Improved
- Dockerfile uses Alpine-based images (smaller, more secure)
- Optimized CI/CD workflows (removed unnecessary artifact upload/download)
- Docker layer caching with GitHub Actions cache (faster builds)
- Build tags use short commit SHA (7 chars) instead of full SHA
- Yarn install with 10-minute timeout and triple retry (fixes ARM64 build timeouts)

### 📝 Documentation
- CORS configuration fully documented with examples
- .env.example with clear usage instructions for local dev, Docker, and docker-compose
- Security rule documented: cannot combine credentials=true with origins=*
- API key authentication usage examples

## [3.1.1-alpha] - 2026-02-01

### ✨ Added

**Cross-Reference Detection & Synchronization**
- Key-based reference detection - automatically detects when field values appear in other fields with different keys
- "Update References" checkbox - maintains data integrity by updating all references when randomizing a field
- Works for ANY field type (IDs, names, emails, companies, phone numbers, addresses, etc.)
- Reference indicators show which fields have cross-references with count
- Supports irregular arrays and nested object structures

**Review & Preview**
- Review modal to preview all pending changes before applying
- View configured faker types, options, and checkbox states for each field
- Remove individual configurations from review list
- Two-way workflow: Review first OR Apply directly

**Visual Improvements**
- Green badges on tree nodes show configured fields with faker type
- ObjectConfigPanel displays useful information when selecting objects
- Cleaner tree view without value previews
- Shows only irregular fields in array structure warnings
- Fixed modal height prevents UI jumping when changing options

**Configuration**
- CORS configuration via environment variables (MOCKTAIL_CORS_ORIGINS, MOCKTAIL_CORS_METHODS, etc.)
- Supports allowed origins, methods, headers, and credentials
- Default: permissive (allow all) for easy local development
- API key authentication for mock endpoints (MOCKTAIL_API_KEY)
- Dashboard and Core API are exempt from API key requirement
- Supports both header (X-API-Key) and query parameter (?api_key=...)

### 🔧 Fixed
- Path normalization works correctly in all zoom levels
- Configuration indicators appear at any tree depth
- Reference detection works with both bracket `[0]` and dot `.0.` notation
- Modal maintains consistent height when switching between faker types

### 🗑️ Removed
- "Keep Original" button (still available in type dropdown)
- Field path display (breadcrumb shows path)
- Current value display (reduces visual clutter)
- Value previews in tree (cleaner navigation)

## [3.1.0-alpha] - 2026-01-25

### ✨ Added

**Randomize & Anonymize (Alpha)**
- Interactive tree-based JSON editor with breadcrumb navigation
- 20+ faker types with intelligent field name detection
- Auto-generated configuration forms based on faker type
- Live preview with regenerate button
- "Apply to all" checkbox for bulk operations across array items
- Smart handling of irregular arrays with field frequency indicators
- Custom phone format patterns
- Tree zoom functionality for deeply nested structures

**Code Examples Modal**
- Multi-language code snippets (cURL, Node.js, Python, Go)
- One-click copy buttons
- Accessible from catalog detail view

### 🐛 Fixed
- Catalog selection persistence after saves
- React key prop usage for proper list reconciliation

### 📦 Dependencies
- Added @faker-js/faker@^10.2.0

## [3.0.3] - 2026-01-18

### ✨ Added
- Code Examples modal with cURL, Node.js, Python, and Go snippets
- Generate menu dropdown in Create tab (UI preview for upcoming features)

### 🐛 Fixed
- Catalog selection persistence with search filters active
- Endpoint selection lost after updating status codes or delays
- Improved state management with useReducer

## [3.0.2] - 2026-01-19

### ✨ Added
- Custom status codes and response delays per endpoint
- CodeMirror JSON editor with syntax highlighting and error detection
- Quick actions in catalog (test, edit, copy, delete)
- Quick edit modal for status codes and delays
- Tab persistence in URL

### 🎨 Improved
- Two-column Create tab layout
- Visual feedback for copy and test actions
- Cleaner delete dialog

### 🔧 Technical
- Backend: StatusCode and Delay fields with validation (max 30000ms)
- Import/Export: Full support for new fields with backward compatibility

## [3.0.0] - 2026-01-10

### ✨ Added
- Chakra UI v3 upgrade with modern design
- Multi-platform Docker support (amd64, arm64)
- Health endpoint `/health` for monitoring
- Customizable URLs with MOCKTAIL_BASE_URL env var
- Auto-skip duplicates on import
- Database directory auto-creates on first run

### 🔧 Updated
- Go 1.21 → 1.23 (security patches)
- GORM v1 → v2 (performance)
- Fiber v2.22 → v2.52 (security)
- golang.org/x/crypto v0.31.0 (CVE fixes)

### 🔄 Changed
- Import moved to Catalog tab
- Drag & drop removed (native file input)
- react-dropzone removed

### ⚠️ Breaking
- v3.0 not backwards compatible with v2.x databases
- Migration: Export from v2 → Import to v3

## [2.0.4] - 2025-12-16
  
### Updated
  
- Add Dockerfile to build dashboard + api
- Add docker-compose.yml
- Move `apis.db` to `/db` directory for support docker mounting volumes (persistent db needs)

## [2.0.3] - 2022-02-26

### Bugfix
  
- [issue #6 fixed](https://github.com/Huseyinnurbaki/mocktail/issues/6)

## [2.0.2] - 2022-01-14
  
### Updated
  
- UI improvements

## [2.0.1] - 2022-01-05
  
### Updated
  
- UI improvements
- input validations improved.

## [2.0.0] - 2022-01-03
  
### Updated
  
- NodeJS replaced with Go Fiber.
- React Upgrade
- Containerization automated (GitHub Actions)

## [1.0.1] - 2020-06-19
  
### Changed
  
- Docker Image size shrinked with multi-stage build.

## [1.0.0] - 2020-05-06

### First Release

[2.0.0]: https://github.com/Huseyinnurbaki/mocktail/releases/tag/2.0.0
[2.0.1]: https://github.com/Huseyinnurbaki/mocktail/releases/tag/2.0.1
[2.0.2]: https://github.com/Huseyinnurbaki/mocktail/releases/tag/2.0.2
[2.0.3]: https://github.com/Huseyinnurbaki/mocktail/releases/tag/2.0.3
