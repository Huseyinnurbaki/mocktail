# Mocktail MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets AI assistants manage [Mocktail](https://github.com/Huseyinnurbaki/mocktail) mock API endpoints through natural language.

## Tools

| Tool | Description |
|------|-------------|
| `list_mocks` | List all configured mock endpoints |
| `create_mock` | Create a single mock endpoint |
| `update_mock` | Update an existing mock by ID |
| `delete_mock` | Delete a mock by ID |
| `import_mocks` | Bulk import multiple mock endpoints (skips duplicates) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MOCKTAIL_URL` | Yes | Base URL of your Mocktail instance (e.g. `http://localhost:4000`) |
| `MOCKTAIL_API_KEY` | No | API key, sent as `X-API-Key` header |

> **Note:** If you're running Mocktail behind a reverse proxy or custom domain (via `MOCKTAIL_BASE_URL`), use that host as `MOCKTAIL_URL` (e.g. `MOCKTAIL_URL=https://api.mycompany.com`).

## Setup

### npx (Recommended)

**Claude Code:**
```bash
claude mcp add mocktail \
  -e MOCKTAIL_URL=http://localhost:4000 \
  -e MOCKTAIL_API_KEY=your-api-key \
  -- npx mocktail-mcp
```

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "mocktail": {
      "command": "npx",
      "args": ["mocktail-mcp"],
      "env": {
        "MOCKTAIL_URL": "http://localhost:4000",
        "MOCKTAIL_API_KEY": "your-api-key"
      }
    }
  }
}
```

### From Source (Development)

If you cloned the repo and want to run the MCP server locally:

```bash
cd mcp-server && npm install
```

**Claude Code:**
```bash
claude mcp add mocktail \
  -e MOCKTAIL_URL=http://localhost:4000 \
  -e MOCKTAIL_API_KEY=your-api-key \
  -- node /absolute/path/to/mcp-server/index.js
```

**Claude Desktop:**
```json
{
  "mcpServers": {
    "mocktail": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/index.js"],
      "env": {
        "MOCKTAIL_URL": "http://localhost:4000",
        "MOCKTAIL_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage Examples

Once connected, you can use natural language:

- "List all my mock endpoints"
- "Create a GET /api/users mock that returns a list of 3 users"
- "Delete mock endpoint #5"
- "Import mock endpoints for a blog API with posts, comments, and authors"
