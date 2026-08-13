package ai

import (
	"encoding/json"
	"fmt"
	"strings"

	"mocktail-api/core"
	"mocktail-api/database"
)

// The assistant is chat-only (no tools yet), so it can't look a mock up on demand. Instead we
// hand it a compact, read-only snapshot of the current mocks as extra system context, so it can
// answer questions about specific endpoints ("what does /api/v1/auth/logout return"). Bounded so a
// large instance can't blow up the request.
const (
	catalogBodyCap  = 600   // max chars of each response body included
	catalogTotalCap = 24000 // max chars of the whole snapshot
)

// catalogContext returns the snapshot, or "" when there are no mocks or the DB is unavailable
// (e.g. unit tests). Appended to the system prompt per chat request.
func catalogContext() string {
	if database.DBConn == nil {
		return ""
	}
	var apis []core.Api
	if err := database.DBConn.Find(&apis).Error; err != nil || len(apis) == 0 {
		return ""
	}

	var b strings.Builder
	b.WriteString("Current mocks in this Mocktail instance. Use these to answer questions about " +
		"specific endpoints; don't invent endpoints that aren't listed.\n\n")

	truncated := false
	for _, a := range apis {
		if b.Len() > catalogTotalCap {
			truncated = true
			break
		}
		path := a.Endpoint
		if !strings.HasPrefix(path, "/") {
			path = "/" + path
		}
		status := a.StatusCode
		if status == 0 {
			status = 200
		}
		fmt.Fprintf(&b, "%s %s -> %d", a.Method, path, status)
		if a.Delay > 0 {
			fmt.Fprintf(&b, " (delay %dms)", a.Delay)
		}
		if len(a.Randomize) > 0 {
			b.WriteString(" (randomized per request)")
		}
		b.WriteByte('\n')

		if body := compactJSON(a.Response); body != "" {
			if len(body) > catalogBodyCap {
				body = body[:catalogBodyCap] + "…"
			}
			fmt.Fprintf(&b, "response: %s\n", body)
		}
		b.WriteByte('\n')
	}
	if truncated {
		b.WriteString("(list truncated — more mocks exist)\n")
	}
	return b.String()
}

// compactJSON collapses a stored response to a single line; falls back to the raw string.
func compactJSON(raw []byte) string {
	if len(raw) == 0 {
		return ""
	}
	var v interface{}
	if err := json.Unmarshal(raw, &v); err != nil {
		return strings.TrimSpace(string(raw))
	}
	out, err := json.Marshal(v)
	if err != nil {
		return strings.TrimSpace(string(raw))
	}
	return string(out)
}
