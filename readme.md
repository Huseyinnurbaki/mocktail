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
[v3.1 Alpha](#v31-alpha) 🧪 •
[v3.0 Changes](#v30-changes) 🔥

> **Note:** Looking for v2? See [v2.0.3](https://github.com/Huseyinnurbaki/mocktail/tree/2.0.3) - the last stable v2 release.

> **Alpha Release:** v3.1.0-alpha includes experimental data randomization features. Some functionality may be unstable or change before final release.

</div>

<p align="center">
  <img src="https://github.com/Huseyinnurbaki/notes/blob/master/Storage/mocktail_V3.gif?raw=true" alt="mocktail_gif" />
</p>

## Quickstart

<details>
  <summary>Docker 🐳</summary>

## Run Mocktail in a Docker container 🐳

```console
docker run -p 4000:4000 -v $(pwd)/db:/db -d hhaluk/mocktail:3.0.0
```

The `-v $(pwd)/db:/db` flag mounts a local directory to persist your mock data.

### Go to **localhost:4000** 🏃

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

### Go to **localhost:4000** 🏃

The database is automatically persisted in `./mocktail-api/db/` on your host machine.

</details>

## Features

- **Create Mock APIs** - Support for GET/POST/PUT/PATCH/DELETE methods
- **Custom Status Codes** - Return any HTTP status (200, 404, 500, etc.) to test error handling
- **Response Delays** - Add 0-30000ms delay to simulate network latency and loading states
- **JSON Editor** - CodeMirror-powered editor with syntax highlighting, error detection, and code folding
- **Code Examples** - Instantly generate cURL, Node.js, Python, and Go code snippets for any endpoint
- **Randomize & Anonymize** ⚠️ *Alpha* - Generate realistic fake data with 20+ faker types (names, emails, phones, addresses, etc.) with smart auto-detection and per-field configuration
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

## Configuration

### Environment Variables

**`REACT_APP_MOCKTAIL_URL`** (optional)

Override the Mocktail URL displayed in the dashboard. Useful when deploying behind a reverse proxy or custom domain.

```bash
# Example: Custom domain
REACT_APP_MOCKTAIL_URL=https://api.mycompany.com/mocktail

# Example: Reverse proxy
REACT_APP_MOCKTAIL_URL=https://gateway.example.com/mocktail
```

If not set, defaults to:
- **Development:** `http://localhost:4000/mocktail`
- **Production:** `[your-domain]/mocktail`

## v3.1 Alpha

### 🧪 Experimental Features

**Randomize & Anonymize (Alpha)**
- Generate realistic fake data for JSON responses using faker.js
- Interactive tree view with breadcrumb navigation for deep structures
- 20+ configurable faker types with smart field name detection
- Per-field configuration with live preview and regenerate
- Selective application to array items via "Apply to all" checkbox
- Support for irregular arrays with field frequency indicators
- Custom phone number formats
- Configurable number ranges and decimal precision

**Known Limitations:**
- Some faker configurations may not work as expected
- Edge cases with deeply nested irregular structures
- Feature is under active development and subject to change

**What's Next:**
- Generate from prompt (AI-powered JSON generation)
- Additional faker types and configuration options
- Improved array generation controls
- Stability improvements and bug fixes

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
go run main.go
```

**Dashboard:**

```console
cd mocktail-dashboard
yarn install
yarn start
```

Backend runs on **localhost:4000**, Dashboard on **localhost:3001**

VSCode debug configuration is included for Go debugging.

</details>

### References

- [Changelog](https://github.com/Huseyinnurbaki/mocktail/blob/master/changelog.md)
