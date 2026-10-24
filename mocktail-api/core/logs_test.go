package core

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"mocktail-api/logger"

	"github.com/gofiber/fiber/v2"
)

func logsApp() *fiber.App {
	app := fiber.New()
	app.Get("/logs", GetLogs)
	app.Get("/logs/:id", GetLog)
	app.Delete("/logs", ClearLogs)
	return app
}

type logsResp struct {
	Logs    []logger.LogEntry `json:"logs"`
	Count   int               `json:"count"`
	Epoch   string            `json:"epoch"`
	FirstID uint64            `json:"firstId"`
}

func getLogs(t *testing.T, app *fiber.App, query string) logsResp {
	t.Helper()
	status, raw := do(t, app, "GET", "/logs"+query, nil)
	if status != http.StatusOK {
		t.Fatalf("GET /logs%s → %d: %s", query, status, raw)
	}
	var r logsResp
	if err := json.Unmarshal(raw, &r); err != nil {
		t.Fatalf("decode: %v (%s)", err, raw)
	}
	return r
}

// The list is summaries only (bodies would make every 1.5s poll ship the whole buffer); the full
// entry comes from /logs/:id.
func TestGetLogsSummariesAndDetail(t *testing.T) {
	app := logsApp()
	buf := logger.GetGlobalBuffer()
	buf.Clear()
	logger.LogRequest(logger.Exchange{
		Method: "POST", Path: "/mocktail/orders", Query: "dry=1", Status: 201, Duration: "2ms",
		RequestHeaders: map[string]string{"Content-Type": "application/json"},
		RequestBody:    []byte(`{"item":"book"}`),
		ResponseBody:   []byte(`{"id":7}`), ResponseHeaders: map[string]string{"X-Req": "1"},
	})
	logger.LogRequest(logger.Exchange{Method: "GET", Path: "/mocktail/orders/7", Status: 200, Duration: "1ms", ResponseBody: []byte(`{"id":7,"ok":true}`)})

	r := getLogs(t, app, "")
	if r.Count != 2 || len(r.Logs) != 2 || r.Epoch != logger.Epoch {
		t.Fatalf("unexpected list: %+v", r)
	}
	first := r.Logs[0]
	if first.ResponseBody != "" || first.ResponseHeaders != nil ||
		first.RequestBody != "" || first.RequestHeaders != nil || first.RequestQuery != "" {
		t.Errorf("list leaked body/headers/query: %+v", first)
	}
	if first.RequestSize != 15 {
		t.Errorf("summary should keep requestSize for the tab label, got %d", first.RequestSize)
	}
	if first.Method != "POST" || first.Status != 201 || first.ResponseSize != 8 || first.ID != r.FirstID {
		t.Errorf("summary missing list fields: %+v (firstId %d)", first, r.FirstID)
	}

	// Incremental: only what's newer than the cursor.
	if inc := getLogs(t, app, fmt.Sprintf("?after=%d", first.ID)); len(inc.Logs) != 1 || inc.Logs[0].Path != "/mocktail/orders/7" {
		t.Errorf("?after=%d should return just the second entry, got %+v", first.ID, inc.Logs)
	}

	status, raw := do(t, app, "GET", fmt.Sprintf("/logs/%d", first.ID), nil)
	if status != http.StatusOK {
		t.Fatalf("GET /logs/%d → %d", first.ID, status)
	}
	var full logger.LogEntry
	if err := json.Unmarshal(raw, &full); err != nil {
		t.Fatal(err)
	}
	if full.ResponseBody != `{"id":7}` || full.ResponseHeaders["X-Req"] != "1" {
		t.Errorf("detail missing body/headers: %+v", full)
	}
	if full.RequestBody != `{"item":"book"}` || full.RequestQuery != "dry=1" || full.RequestHeaders["Content-Type"] != "application/json" {
		t.Errorf("detail missing request side: %+v", full)
	}
}

func TestGetLogsLimitKeepsNewest(t *testing.T) {
	app := logsApp()
	logger.GetGlobalBuffer().Clear()
	for i := 0; i < 5; i++ {
		logger.LogRequest(logger.Exchange{Method: "GET", Path: fmt.Sprintf("/mocktail/%d", i), Status: 200, Duration: "1ms"})
	}
	r := getLogs(t, app, "?limit=2")
	if len(r.Logs) != 2 || r.Logs[1].Path != "/mocktail/4" {
		t.Errorf("?limit=2 should return the newest two, got %+v", r.Logs)
	}
	// Legacy ?lines= still caps the list.
	if r := getLogs(t, app, "?lines=1"); len(r.Logs) != 1 {
		t.Errorf("?lines=1 should return one entry, got %d", len(r.Logs))
	}
}

func TestGetLogsBadInput(t *testing.T) {
	app := logsApp()
	if status, _ := do(t, app, "GET", "/logs?after=-1", nil); status != http.StatusBadRequest {
		t.Errorf("?after=-1 → %d, want 400", status)
	}
	if status, _ := do(t, app, "GET", "/logs/abc", nil); status != http.StatusBadRequest {
		t.Errorf("/logs/abc → %d, want 400", status)
	}
}

func TestGetLogMissingAndCleared(t *testing.T) {
	app := logsApp()
	buf := logger.GetGlobalBuffer()
	buf.Clear()
	logger.LogRequest(logger.Exchange{Method: "GET", Path: "/mocktail/x", Status: 200, Duration: "1ms"})
	id := buf.GetLast(1)[0].ID

	if status, _ := do(t, app, "DELETE", "/logs", nil); status != http.StatusOK {
		t.Fatalf("DELETE /logs → %d", status)
	}
	if status, _ := do(t, app, "GET", fmt.Sprintf("/logs/%d", id), nil); status != http.StatusNotFound {
		t.Errorf("cleared entry → %d, want 404", status)
	}
	// After a clear, firstId moves past every old ID so clients drop what they hold.
	if r := getLogs(t, app, ""); len(r.Logs) != 0 || r.FirstID <= id {
		t.Errorf("after clear: %d logs, firstId %d (want 0 logs, firstId > %d)", len(r.Logs), r.FirstID, id)
	}
}
