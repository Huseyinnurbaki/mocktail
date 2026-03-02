#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const MOCKTAIL_URL = process.env.MOCKTAIL_URL;
const MOCKTAIL_API_KEY = process.env.MOCKTAIL_API_KEY || "";

if (!MOCKTAIL_URL) {
  console.error("MOCKTAIL_URL environment variable is required");
  process.exit(1);
}

function normalizeEndpoint(endpoint) {
  return endpoint.replace(/^\/+/, "");
}

async function mocktailRequest(path, options = {}) {
  const base = MOCKTAIL_URL.replace(/\/+$/, "");
  const url = `${base}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (MOCKTAIL_API_KEY) {
    headers["X-API-Key"] = MOCKTAIL_API_KEY;
  }

  const res = await fetch(url, { ...options, headers });
  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.message || `Request failed with status ${res.status}`);
  }
  return body;
}

const server = new McpServer({
  name: "mocktail",
  version: "3.1.6",
});

// list_mocks
server.tool(
  "list_mocks",
  "List all configured mock endpoints in Mocktail",
  {},
  async () => {
    try {
      const mocks = await mocktailRequest("/core/v1/apis");
      return {
        content: [{ type: "text", text: JSON.stringify(mocks, null, 2) + `\n\nMock endpoints are accessible at: ${MOCKTAIL_URL}/mocktail/{Endpoint}` }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

// create_mock
server.tool(
  "create_mock",
  "Create a new mock endpoint. Method must be GET, POST, PUT, PATCH, or DELETE. Response should be a JSON value (object, array, string, etc.). The endpoint path is relative — e.g. '/api/users' becomes accessible at MOCKTAIL_URL/mocktail/api/users.",
  {
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
    endpoint: z.string().describe("URL path starting with /, e.g. /api/users. Accessible at MOCKTAIL_URL/mocktail/api/users"),
    response: z.string().describe("JSON string for the response body"),
    statusCode: z.number().optional().describe("HTTP status code (default 200)"),
    delay: z.number().optional().describe("Response delay in ms (0-30000, default 0)"),
  },
  async ({ method, endpoint, response, statusCode, delay }) => {
    try {
      endpoint = normalizeEndpoint(endpoint);
      const parsed = JSON.parse(response);
      const result = await mocktailRequest("/core/v1/api", {
        method: "POST",
        body: JSON.stringify({
          Method: method,
          Endpoint: endpoint,
          Response: parsed,
          StatusCode: statusCode ?? 200,
          Delay: delay ?? 0,
        }),
      });
      const accessUrl = `${MOCKTAIL_URL}/mocktail/${endpoint}`;
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) + `\n\nAccessible at: ${method} ${accessUrl}` }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

// update_mock
server.tool(
  "update_mock",
  "Update an existing mock endpoint by ID. All fields are required since the entire mock is replaced. The endpoint path is relative — e.g. '/api/users' becomes accessible at MOCKTAIL_URL/mocktail/api/users.",
  {
    id: z.number().describe("Mock endpoint ID"),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
    endpoint: z.string().describe("URL path starting with /, e.g. /api/users"),
    response: z.string().describe("JSON string for the response body"),
    statusCode: z.number().optional().describe("HTTP status code (default 200)"),
    delay: z.number().optional().describe("Response delay in ms (0-30000, default 0)"),
  },
  async ({ id, method, endpoint, response, statusCode, delay }) => {
    try {
      endpoint = normalizeEndpoint(endpoint);
      const parsed = JSON.parse(response);
      const result = await mocktailRequest(`/core/v1/api/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          Method: method,
          Endpoint: endpoint,
          Response: parsed,
          StatusCode: statusCode ?? 200,
          Delay: delay ?? 0,
        }),
      });
      const accessUrl = `${MOCKTAIL_URL}/mocktail/${endpoint}`;
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) + `\n\nAccessible at: ${method} ${accessUrl}` }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

// delete_mock
server.tool(
  "delete_mock",
  "Delete a mock endpoint by ID",
  {
    id: z.number().describe("Mock endpoint ID to delete"),
  },
  async ({ id }) => {
    try {
      const result = await mocktailRequest(`/core/v1/api/${id}`, {
        method: "DELETE",
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

// import_mocks
server.tool(
  "import_mocks",
  "Bulk import multiple mock endpoints. Existing endpoints (same method+path) are skipped. Response fields should be JSON strings.",
  {
    mocks: z.array(
      z.object({
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
        endpoint: z.string().describe("URL path starting with /, e.g. /api/users"),
        response: z.string().describe("JSON string for the response body"),
        statusCode: z.number().optional().describe("HTTP status code (default 200)"),
        delay: z.number().optional().describe("Response delay in ms (default 0)"),
      })
    ).describe("Array of mock endpoints to import"),
  },
  async ({ mocks }) => {
    try {
      const apis = mocks.map((m) => ({
        Method: m.method,
        Endpoint: normalizeEndpoint(m.endpoint),
        Response: JSON.parse(m.response),
        StatusCode: m.statusCode ?? 200,
        Delay: m.delay ?? 0,
      }));
      const result = await mocktailRequest("/core/v1/import", {
        method: "POST",
        body: JSON.stringify({ Apis: apis }),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
