# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)

## [3.1.3-alpha] - 2026-02-03

### ✨ Added

**Backend Logs Tab**
- Split-view interface with request list (left) and full details (right)
- Real-time monitoring with 2-second auto-refresh
- Click requests to view full response body with pretty-printed JSON
- Method badges color-coded by HTTP verb (GET, POST, PUT, DELETE, PATCH)
- Status indicators with color coding (2xx, 3xx, 4xx, 5xx)
- Copy/download response as JSON file
- Smart filtering excludes polling endpoints (/core/v1/logs, /core/v1/apis)
- Structured logging stores method, path, status, duration, and full response
- In-memory buffer keeps last 500 requests for debugging
- Scrollable request list and response area with fixed heights

**Enhanced Code Examples**
- API key field with masked display (******* by default)
- Show/hide toggle for API key visibility (eye icon)
- Copy always includes actual API key value (not masked)
- Code examples auto-include X-API-Key header when API key is set
- All 4 languages updated (cURL, Node.js, Python, Go)

### 🔧 Fixed
- Log entry mutation causing paths to change incorrectly
- Deep copying on both backend and frontend prevents data corruption
- Request list properly scrollable with overflow
- Response area has fixed height with scroll (doesn't expand)
- Clear All now clears both request list and selected details

### 🎨 Improved
- Response JSON automatically pretty-printed with 2-space indentation
- Terminal-style dark theme for response viewer
- Auto-selects latest request on first load

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
