<div align="center">

# Mocktail

![Docker Image Version (latest by date)](https://img.shields.io/docker/v/hhaluk/mocktail?color=blue&logo=docker)
![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/hhaluk/mocktail?color=B4D4A55&logo=docker)
![Docker Image Version (latest semver)](https://img.shields.io/docker/v/hhaluk/mocktail?label=stable-version&logo=docker&sort=semver&style=flat-square)
![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/Huseyinnurbaki/mocktail?include_prereleases&logo=github)
[![Docker Build CI](https://github.com/Huseyinnurbaki/mocktail/actions/workflows/dockerize.yml/badge.svg?branch=master)](https://github.com/Huseyinnurbaki/mocktail/actions/workflows/dockerize.yml)
![Docker Pulls](https://img.shields.io/docker/pulls/hhaluk/mocktail?color=gray&logo=docker)

Mocktail is completely free, lightweight (~13MB), self-hosted, containerized mock server with a modern dashboard.

No limitations or restrictions. Mock any HTTP request. Export and import your mocks.

[Quickstart](#quickstart) 🚀 •
[Features](#features) ✨ •
[Changelog](changelog.md) 📋 •
[v3.0 Changes](#v30-changes) 🔥

> **Note:** Looking for v2? See [v2.0.3](https://github.com/Huseyinnurbaki/mocktail/tree/2.0.3) - the last stable v2 release.

</div>

<p align="center">
  <img src="https://github.com/Huseyinnurbaki/notes/blob/master/Storage/mocktail_V3.gif?raw=true" alt="mocktail_gif" />
</p>

## Quickstart

<details>
  <summary>Docker 🐳</summary>

## Run Mocktail in a Docker container 🐳

```console
docker run -p 6625:6625 -v $(pwd)/db:/db -d hhaluk/mocktail:3.1.6
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

- **Create Mock APIs** - Support for GET/POST/PUT/PATCH/DELETE methods
- **Custom Status Codes** - Return any HTTP status (200, 404, 500, etc.) to test error handling
- **Response Delays** - Add 0-30000ms delay to simulate network latency and loading states
- **JSON Editor** - CodeMirror-powered editor with syntax highlighting, error detection, and code folding
- **Code Examples** - Instantly generate cURL, Node.js, Python, and Go code snippets for any endpoint
- **Randomize & Anonymize** ⚠️ _Beta_ - Generate realistic fake data with 20+ faker types plus Custom (fixed value) and AI Generate (prompt-based) modes, with per-field configuration, live preview, and "apply same value to all" support
- **Irregular Array Support** - Handles arrays with inconsistent object structures, showing field frequency and applying configs selectively
- **Modern Dashboard** - Clean, intuitive interface built with React and Chakra UI v3
- **Catalog View** - Browse, search, and manage all your mock endpoints with quick actions and persistent selection
- **Quick Edit** - Update status codes and delays instantly via gear icon in catalog
- **Test Endpoints** - Test mocks directly from the catalog list with visual feedback
- **Import/Export** - Export mocks to JSON and import them anywhere
- **Persistent Storage** - SQLite database with volume mounting
- **Multi-Platform** - Native support for amd64 and arm64 (Intel, Apple Silicon, Raspberry Pi)
- **Health Check** - `/health` endpoint for monitoring and orchestration
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

- 🔒 Mock endpoints (`/mocktail/*`) - Requires API key
- ✅ Dashboard (`/`) - No auth needed
- ✅ Core API (`/core/v1/*`) - No auth needed (dashboard uses this)
- ✅ Health check (`/health`) - No auth needed

**Security Note:** If not set, mock endpoints are open (no authentication). This is fine for local development or private networks.

## Recent Changes

See the full [Changelog](changelog.md) for all release notes.

**v3.1.6** — Backend & MCP endpoint leading-slash normalization (fixes `/mocktail//posts/1`-style double-slash URLs)

**v3.1.5** — MCP endpoint path normalization (fixes double slashes), catalog pagination

**v3.1.4** — MCP Server AI integration (`npx mocktail-mcp`), Randomize & Anonymize UX overhaul (three-column layout, Custom & AI Generate types)

**v3.1.3** — Backend Logs tab with real-time monitoring, enhanced code examples with API key support, critical Go string mutation bugfix

**v3.1.2** — API key authentication, configurable CORS, `.env` file support

**v3.1.1** — Cross-reference detection, review modal, Randomize & Anonymize improvements

## v3.0 Changes

### 🎉 What's New

- **Custom Status Codes & Delays** - Configure HTTP status codes and response delays per endpoint
- **CodeMirror JSON Editor** - Professional code editor with syntax highlighting and error detection
- **Quick Actions** - Test, edit, copy, and delete directly from the catalog list with icon buttons
- **Chakra UI v3** - Complete UI library upgrade with modern components
- **Go 1.24 & GORM v2** - Latest backend stack with improved performance
- **Fiber v2.52** - Updated web framework with security patches
- **Cleaner Architecture** - Improved code organization and consistency
- **Health Endpoint** - `/health` for Docker health checks and monitoring
- **Auto-Setup** - Database directory auto-creates on first run
- **Import/Export UI** - Moved to Catalog tab with better UX

### 🔄 What Changed

- **Import Tab Removed** - Import functionality now in Catalog tab
- **Drag & Drop Removed** - Simplified to native file input
- **react-dropzone Removed** - Reduced dependencies

### ⚠️ Breaking Changes

**v3.0 is not backwards compatible with v2.x databases.**

However, you can migrate your data:

1. In v2, export your mocks to JSON (Catalog → Export)
2. Install v3.0
3. Import the JSON file (Catalog → Import)

Your mock endpoints will work unchanged - only the internal database structure changed.

## Development

<details>
  <summary>Local Development 🏃</summary>

### Using Makefile (Recommended)

```console
# Run backend dev server
make dev-api

# Run dashboard dev server (in another terminal)
make dev-dashboard

# Build everything
make build

# Build Docker image
make build-docker
```

### Manual Setup

**Backend:**

```console
cd mocktail-api
cp .env.example .env   # optional — set MOCKTAIL_PORT, MOCKTAIL_DB_PATH, CORS, etc. (auto-loaded)
go run main.go
```

> The backend reads `mocktail-api/.env` on startup (gitignored). `make dev-api` / `make run` already
> point `MOCKTAIL_DB_PATH` at the in-repo `db/apis.db` so your local mocks persist there.

**Dashboard:**

```console
cd mocktail-dashboard
yarn install
yarn start
```

Backend runs on **localhost:6625**, Dashboard on **localhost:3001**

VSCode debug configuration is included for Go debugging.

</details>

### References

- [Changelog](https://github.com/Huseyinnurbaki/mocktail/blob/master/changelog.md)
