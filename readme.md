<div align="center">

# Mocktail

![Docker Image Version (latest by date)](https://img.shields.io/docker/v/hhaluk/mocktail?color=blue&logo=docker)
![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/hhaluk/mocktail?color=B4D4A55&logo=docker)
![Docker Image Version (latest semver)](https://img.shields.io/docker/v/hhaluk/mocktail?label=stable-version&logo=docker&sort=semver&style=flat-square)
![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/Huseyinnurbaki/mocktail?include_prereleases&logo=github)
[![Docker Build CI](https://github.com/Huseyinnurbaki/mocktail/actions/workflows/dockerize.yml/badge.svg?branch=master)](https://github.com/Huseyinnurbaki/mocktail/actions/workflows/dockerize.yml)
![Docker Pulls](https://img.shields.io/docker/pulls/hhaluk/mocktail?color=gray&logo=docker)

Mocktail is a completely free, self-hosted, single-binary mock server with a modern dashboard — now with an in-app AI assistant.

No limitations or restrictions. Mock any HTTP request. Export and import your mocks.

[Quickstart](#quickstart) 🚀 •
[Features](#features) ✨ •
[Changelog](changelog.md) 📋 •
[What's new in v4](changelog.md#400---2026-08-13) 🔥

> **On v3?** The last v3 release lives on the [`v3.1.9`](https://github.com/Huseyinnurbaki/mocktail/tree/v3.1.9) branch — check it out to stay on v3, or see [Upgrading from v3.x](changelog.md#400---2026-08-13) to move to v4.

</div>

<p align="center">
  <img src="https://github.com/Huseyinnurbaki/notes/blob/master/Storage/mocktail_V4.gif?raw=true" alt="Mocktail dashboard" />
</p>

## Quickstart

<details open>
  <summary>Homebrew — macOS / Linux 🍺</summary>

## Install with Homebrew

```console
brew install --cask Huseyinnurbaki/tap/mocktail
mocktail
```

`mocktail` starts the server and serves the dashboard from a single self-contained binary — no Docker required.

### Go to **localhost:6625** 🏃

</details>

<details>
  <summary>Docker 🐳</summary>

## Run Mocktail in a Docker container 🐳

```console
docker run -p 6625:6625 -v $(pwd)/db:/db -d hhaluk/mocktail:4.0.0
```

The `-v $(pwd)/db:/db` flag mounts a local directory to persist your mock data.

### Go to **localhost:6625** 🏃

</details>

<details>
  <summary>Docker Compose 🐳</summary>

## Run with Docker Compose

```console
docker-compose up -d
```

Or build and run:

```console
docker-compose up -d --build
```

### Go to **localhost:6625** 🏃

The database is automatically persisted in `./mocktail-api/db/` on your host machine.

</details>

## Features

- **AI Assistant** ✨ - An in-app assistant that answers questions about Mocktail and your own mocks, and can **create / update / delete** endpoints from natural language — the catalog updates live as it works. Bring your own key; it's stored in the OS keychain and used server-side only, never in the browser
- **Create Mock APIs** - Support for GET/POST/PUT/PATCH/DELETE methods
- **Custom Status Codes** - Return any HTTP status (200, 404, 500, etc.) to test error handling
- **Response Headers** - Set custom headers per mock, including a `Content-Type` override (e.g. `application/problem+json`)
- **Response Delays** - Add 0-30000ms delay to simulate network latency and loading states
- **Live Traffic** - A filterable stream of real requests hitting your mocks (method / status / path), with the served response, headers, and keyboard navigation
- **Randomize** - Generate realistic fake data with 20+ faker types plus fixed values, per-field configuration, and live preview — static by default, fresh on each request when enabled
- **JSON Editor** - CodeMirror 6 editor with syntax highlighting, error detection, and code folding
- **Code Examples** - Instantly generate cURL, Node.js, Python, and Go code snippets for any endpoint
- **Modern Dashboard** - Clean, responsive interface built with React + Tailwind CSS v4, with light / dark / system themes and accent colors
- **Catalog View** - Browse, search (with inline path completion), and manage all your mocks with quick actions and keyboard shortcuts
- **Test Endpoints** - Test mocks directly from the catalog with status, latency, body, and response headers
- **Import/Export** - Export mocks to JSON (including randomize + headers) and import them anywhere
- **Persistent Storage** - Pure-Go SQLite (no CGO); DB lives in the OS app-data dir by default, or a mounted volume in Docker
- **Optional Auth** - `MOCKTAIL_API_KEY` protects served mocks; `MOCKTAIL_ADMIN_KEY` protects the management API
- **Multi-Platform** - Native support for amd64 and arm64 (Intel, Apple Silicon, Raspberry Pi)
- **Health Check** - `/health` endpoint (reports the bound port) for monitoring and orchestration
- **Customizable URLs** - Override display URLs for reverse proxy/custom domain setups

## MCP Server (AI Integration)

Mocktail includes an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets AI assistants like Claude manage your mock endpoints through natural language. Available on npm as [`mocktail-mcp`](https://www.npmjs.com/package/mocktail-mcp).

**Examples:** "List all my mocks", "Create a GET /api/users mock returning a list of users", "Import mock endpoints for a blog API."

### Available Tools

| Tool           | Description                                   |
| -------------- | --------------------------------------------- |
| `list_mocks`   | List all configured mock endpoints            |
| `create_mock`  | Create a single mock endpoint                 |
| `update_mock`  | Update an existing mock by ID                 |
| `delete_mock`  | Delete a mock by ID                           |
| `import_mocks` | Bulk import multiple mocks (skips duplicates) |

### Setup

<details>
  <summary>npx (Recommended)</summary>

#### Claude Code

```bash
claude mcp add mocktail \
  -e MOCKTAIL_URL=http://localhost:6625 \
  -e MOCKTAIL_API_KEY=your-api-key \
  -- npx mocktail-mcp
```

#### Claude Desktop

Add to your config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "mocktail": {
      "command": "npx",
      "args": ["mocktail-mcp"],
      "env": {
        "MOCKTAIL_URL": "http://localhost:6625",
        "MOCKTAIL_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

<details>
  <summary>From source (Development)</summary>

If you cloned the repo and want to run the MCP server locally:

#### Claude Code

```bash
claude mcp add mocktail \
  -e MOCKTAIL_URL=http://localhost:6625 \
  -e MOCKTAIL_API_KEY=your-api-key \
  -- node /path/to/mocktail/mcp-server/index.js
```

#### Claude Desktop

```json
{
  "mcpServers": {
    "mocktail": {
      "command": "node",
      "args": ["/path/to/mocktail/mcp-server/index.js"],
      "env": {
        "MOCKTAIL_URL": "http://localhost:6625",
        "MOCKTAIL_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

**Environment Variables:**

| Variable           | Required | Description                                                       |
| ------------------ | -------- | ----------------------------------------------------------------- |
| `MOCKTAIL_URL`     | Yes      | Base URL of your Mocktail instance (e.g. `http://localhost:6625`) |
| `MOCKTAIL_API_KEY` | No       | API key sent as `X-API-Key` header on all requests                |

> **Note:** If you configured `MOCKTAIL_BASE_URL` for a custom domain or reverse proxy, use that same URL for `MOCKTAIL_URL` (e.g. `https://api.mycompany.com/mocktail` becomes `MOCKTAIL_URL=https://api.mycompany.com`).

> See [`mcp-server/README.md`](mcp-server/README.md) for more details.

## Configuration

### Environment Variables

**`MOCKTAIL_PORT`** (optional)

Port the server listens on. Defaults to **`6625`** (Mocktail's signature port — "MOCK" on a phone keypad, and clear of the busy `3000`/`4000`/`8080` range). Set it to `auto` (or `0`) to **auto-select** a port: Mocktail prefers `6625`, scans the next 10 (`6626`…`6634`), then falls back to any free port the OS hands out — handy for the desktop app, which has no terminal to resolve a clash. The platform-standard `PORT` variable is also honored.

```bash
MOCKTAIL_PORT=8080     # fixed port
MOCKTAIL_PORT=auto     # prefer 6625, else next free port
```

**`MOCKTAIL_DB_PATH`** (optional)

Path to the SQLite database file.

- **Default (desktop / CLI):** a per-user app-data location, so the DB survives app updates and isn't tied to the directory you launch from:
  - macOS: `~/Library/Application Support/mocktail/apis.db`
  - Linux: `~/.config/mocktail/apis.db` (respects `$XDG_CONFIG_HOME`)
  - Windows: `%AppData%\mocktail\apis.db`
- **Docker:** the image pins `MOCKTAIL_DB_PATH=/db/apis.db` and `docker-compose.yml` mounts `./mocktail-api/db:/db`, so your data still persists in `./mocktail-api/db/` on the host (unchanged).

```bash
# Override the location explicitly
MOCKTAIL_DB_PATH=/var/lib/mocktail/apis.db
```

**`MOCKTAIL_BASE_URL`** (optional)

Override the Mocktail URL displayed in the dashboard. Useful when deploying behind a reverse proxy or custom domain.

> **Note:** The legacy `REACT_APP_MOCKTAIL_URL` environment variable is still supported for backwards compatibility.

```bash
# Example: Custom domain
MOCKTAIL_BASE_URL=https://api.mycompany.com/mocktail

# Example: Reverse proxy
MOCKTAIL_BASE_URL=https://gateway.example.com/mocktail
```

If not set, defaults to:

- **Development:** `http://localhost:6625/mocktail`
- **Production:** `[your-domain]/mocktail`

**CORS Configuration** (optional)

Configure Cross-Origin Resource Sharing (CORS) policies for the mock API.

```bash
# Allowed origins (comma-separated)
# Default: * (allow all)
MOCKTAIL_CORS_ORIGINS=https://myapp.com,http://localhost:3000

# Allowed HTTP methods (comma-separated)
# Default: GET,POST,PUT,PATCH,DELETE,OPTIONS
MOCKTAIL_CORS_METHODS=GET,POST,PUT,DELETE

# Allowed headers (comma-separated)
# Default: * (allow all)
MOCKTAIL_CORS_HEADERS=Content-Type,Authorization,X-API-Key

# Allow credentials (cookies, auth headers)
# Default: false
MOCKTAIL_CORS_CREDENTIALS=true
```

**Docker Example:**

```bash
docker run -p 6625:6625 \
  -e MOCKTAIL_CORS_ORIGINS=https://myapp.com \
  -e MOCKTAIL_CORS_CREDENTIALS=true \
  hhaluk/mocktail:latest
```

**Docker Compose Example:**

```yaml
services:
  mocktail:
    image: hhaluk/mocktail:latest
    ports:
      - "6625:6625"
    environment:
      MOCKTAIL_CORS_ORIGINS: "https://myapp.com,http://localhost:3000"
      MOCKTAIL_CORS_CREDENTIALS: "true"
    volumes:
      - ./db:/db
```

**⚠️ Important Security Rule:**

**DO NOT combine wildcard origins with credentials:**

```bash
# ❌ INVALID - Browsers will reject this combination
MOCKTAIL_CORS_ORIGINS=*
MOCKTAIL_CORS_CREDENTIALS=true

# ✅ VALID - Use specific origins with credentials
MOCKTAIL_CORS_ORIGINS=https://myapp.com,http://localhost:3000
MOCKTAIL_CORS_CREDENTIALS=true

# ✅ VALID - Use wildcard without credentials (default)
MOCKTAIL_CORS_ORIGINS=*
MOCKTAIL_CORS_CREDENTIALS=false
```

When `MOCKTAIL_CORS_CREDENTIALS=true`, you **must** specify exact origins (no `*` wildcard).

**`MOCKTAIL_API_KEY`** (optional)

Protect mock endpoints with API key authentication. When set, all requests to `/mocktail/*` must include the API key.

```bash
# Set API key
MOCKTAIL_API_KEY=your-secret-key-here
```

**Usage:**

Clients must provide the key via header or query parameter:

```bash
# Via header (recommended)
curl http://localhost:6625/mocktail/users \
  -H "X-API-Key: your-secret-key-here"

# Via query parameter
curl http://localhost:6625/mocktail/users?api_key=your-secret-key-here
```

**What's Protected:**

- 🔒 Mock endpoints (`/mocktail/*`) - Requires `MOCKTAIL_API_KEY` (when set)
- 🔒 Core API (`/core/v1/*`) - Requires `MOCKTAIL_ADMIN_KEY` (when set; open by default)
- ✅ Dashboard (`/`) - Always open (so the app loads)
- ✅ Health check (`/health`) - Always open (so the status pill can poll)

**Security Note:** If not set, mock endpoints are open (no authentication). This is fine for local development or private networks.

**`MOCKTAIL_ADMIN_KEY`** (optional)

Protect the **management/dashboard API** (`/core/v1/*`) — this is separate from `MOCKTAIL_API_KEY` (which guards *served mocks*). It also gates the AI endpoints, since they cost real provider credits. Tri-state, like `MOCKTAIL_PORT`:

```bash
# unset  → auth OFF (core API open; default, backward-compatible)
MOCKTAIL_ADMIN_KEY=your-admin-key   # → auth ON with that key (dashboard/MCP send X-Admin-Key)
MOCKTAIL_ADMIN_KEY=auto             # → auth ON with a random key generated each launch
```

With `auto`, the backend prints a ready-to-use URL at startup — `http://localhost:6625/#admin_key=<token>` — where the token rides the URL fragment (`#`, never sent to the server or logged). `/` (static app) and `/health` always stay open so the app loads and the status pill can poll.

### AI Assistant

The dashboard has a built-in **✨ Assistant** (right panel) that can chat about your mocks once you add a provider API key. **The key is a backend secret — it never lives in or passes through the browser, and all provider calls are made server-side.** Currently supports **Anthropic (Claude)**; more providers are drop-in later.

**Adding a key**

- **Desktop / local (recommended):** open **Settings → API keys**, pick the provider, paste your key, and choose a model. The key is validated (a bad key is rejected) and stored securely. Key entry is allowed **only from a local (loopback) session** — a key never crosses a network from a browser.
- **Containers / headless:** set `MOCKTAIL_AI_API_KEY_ANTHROPIC` (env, **per provider** — e.g. `_ANTHROPIC`; the generic `MOCKTAIL_AI_API_KEY` still works as a **deprecated** fallback). When set, it **wins** and the Settings field becomes read-only. Optionally pin a model with `MOCKTAIL_AI_MODEL`.

> **Why `MOCKTAIL_AI_MODEL` for containers?** On desktop you'd just pick the model in Settings. But the Settings choice is stored in a file in the app-data dir, so in an **ephemeral container** it resets on every recreate unless that dir is on a mounted volume. Pinning the model with `MOCKTAIL_AI_MODEL` keeps the AI config **declarative** (all in your compose/orchestrator) and stable across restarts — and it lets an operator force a model on a shared instance (e.g. a cheap one, for cost control). On a single desktop it's redundant.

> There is intentionally **no** env var to *select* the provider — that's a Settings dropdown (data-driven from the backend). Env is only for injecting the secret key + an optional model pin.

**Where your key is stored at rest**

| Surface | Location | Protection |
| ------- | -------- | ---------- |
| **Desktop / CLI** | OS keychain — macOS **Keychain**, Windows **Credential Manager**, Linux **Secret Service** (service `mocktail-ai`, account `apikey-<provider>`) | OS-encrypted, session-gated |
| **Headless Linux** (no Secret Service) | `~/.config/mocktail/ai_key_<provider>` | `0600` file (owner-only) |
| **Containers** | not stored — read from `MOCKTAIL_AI_API_KEY_<PROVIDER>` (or the deprecated `MOCKTAIL_AI_API_KEY`) at runtime | managed by your orchestrator / secrets manager |

Your **non-secret** choices (selected provider + model) persist to `ai_config.json` in the same app-data dir (e.g. macOS `~/Library/Application Support/mocktail/ai_config.json`). The dashboard only ever receives a **masked hint** (`sk-…1234`), never the raw key.

Inspect or remove the stored key any time:

```bash
# macOS — view the keychain item (Keychain Access → search "mocktail-ai" also works)
security find-generic-password -s mocktail-ai -a apikey-anthropic

# Or just use Settings → API keys → Remove
```

> First save on macOS may prompt **"mocktail wants to use the Keychain"** — click Allow.

## Changelog

See [changelog.md](changelog.md) for all release notes and [what's new in v4](changelog.md#400---2026-08-14). Running v3? Use the [`v3.1.9`](https://github.com/Huseyinnurbaki/mocktail/tree/v3.1.9) branch.

## Development

<details>
  <summary>Local Development 🏃</summary>

### Using Makefile (Recommended)

```console
# Run backend dev server
make dev-api

# Run UI dev server (in another terminal)
make dev-ui

# Build everything
make build

# Build Docker image
make build-docker
```

> **Docker build memory:** building the image compiles the pure-Go SQLite (WASM) driver, which is
> memory-heavy — give Docker **≥ 4 GB** (Docker Desktop's 2 GB default can OOM the Go compiler with
> `signal: killed`). This only affects *building* the image; running it needs little. The resulting
> image is ~25 MB (larger than the old CGO build — the tradeoff for CGO-free cross-compilation).

### Manual Setup

**Backend:**

```console
cd mocktail-api
cp .env.example .env   # optional — set MOCKTAIL_PORT, MOCKTAIL_DB_PATH, CORS, etc. (auto-loaded)
go run main.go
```

> The backend reads `mocktail-api/.env` on startup (gitignored). `make dev-api` / `make run` already
> point `MOCKTAIL_DB_PATH` at the in-repo `db/apis.db` so your local mocks persist there.

**Dashboard UI:**

```console
cd mocktail-ui
yarn install
yarn dev
```

Backend runs on **localhost:6625**, UI dev server on **localhost:3001**

VSCode debug configuration is included for Go debugging.

</details>

### References

- [Changelog](https://github.com/Huseyinnurbaki/mocktail/blob/master/changelog.md)
