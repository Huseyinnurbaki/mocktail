package ai

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"mocktail-api/core"
	"mocktail-api/database"

	"github.com/ncruces/go-sqlite3/gormlite"
	"gorm.io/gorm"
)

func useTempDB(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(gormlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&core.Api{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	database.DBConn = db
	t.Cleanup(func() { database.DBConn = nil })
}

// stubAgent replays the given SSE bodies for successive /v1/messages calls (turn 1, turn 2, …).
func stubAgent(t *testing.T, turns ...string) {
	t.Helper()
	var mu sync.Mutex
	n := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/messages" {
			http.Error(w, "not found", 404)
			return
		}
		mu.Lock()
		i := n
		n++
		mu.Unlock()
		if i >= len(turns) {
			i = len(turns) - 1
		}
		w.Header().Set("Content-Type", "text/event-stream")
		io.WriteString(w, turns[i])
	}))
	t.Cleanup(srv.Close)
	t.Setenv(EnvBaseURL, srv.URL)
}

func sseFrame(v any) string {
	b, _ := json.Marshal(v)
	return "data: " + string(b) + "\n\n"
}

func TestAgentCreatesMock(t *testing.T) {
	useTempStore(t)
	useTempDB(t)
	if err := keyStore.Set("key"); err != nil {
		t.Fatalf("set key: %v", err)
	}

	// Turn 1: the model calls create_mock.
	toolTurn := sseFrame(map[string]any{
		"type": "content_block_start", "index": 0,
		"content_block": map[string]any{"type": "tool_use", "id": "toolu_1", "name": "create_mock"},
	}) + sseFrame(map[string]any{
		"type": "content_block_delta", "index": 0,
		"delta": map[string]any{"type": "input_json_delta", "partial_json": `{"method":"GET","endpoint":"/asd","response":"{}"}`},
	}) + sseFrame(map[string]any{"type": "content_block_stop", "index": 0}) +
		sseFrame(map[string]any{"type": "message_delta", "delta": map[string]any{"stop_reason": "tool_use"}}) +
		sseFrame(map[string]any{"type": "message_stop"})

	// Turn 2: after the tool result, the model answers.
	finalTurn := sseFrame(map[string]any{
		"type": "content_block_delta", "index": 0,
		"delta": map[string]any{"type": "text_delta", "text": "Created GET /asd."},
	}) + sseFrame(map[string]any{"type": "message_delta", "delta": map[string]any{"stop_reason": "end_turn"}}) +
		sseFrame(map[string]any{"type": "message_stop"})

	stubAgent(t, toolTurn, finalTurn)

	app := aiApp()
	body, _ := json.Marshal(map[string]any{"messages": []Message{{Role: "user", Content: "create GET /asd"}}})
	req := httptest.NewRequest("POST", "/ai/chat", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("chat: %v", err)
	}
	raw, _ := io.ReadAll(resp.Body)
	s := string(raw)

	if !strings.Contains(s, "event: tool") || !strings.Contains(s, "create_mock") {
		t.Fatalf("stream missing tool event: %q", s)
	}
	if !strings.Contains(s, "Created GET /asd") {
		t.Fatalf("stream missing final text: %q", s)
	}
	if !strings.Contains(s, "event: done") {
		t.Fatalf("stream missing done: %q", s)
	}

	// The mock was actually created.
	var count int64
	database.DBConn.Model(&core.Api{}).Where("key = ?", "GETasd").Count(&count)
	if count != 1 {
		t.Fatalf("mock not created (key GETasd count = %d)", count)
	}
}

func TestExecuteMockToolCreateAndList(t *testing.T) {
	useTempDB(t)
	out, isErr := executeMockTool("create_mock", json.RawMessage(`{"method":"POST","endpoint":"/api/login","response":"{\"token\":\"abc\"}","statusCode":201}`))
	if isErr {
		t.Fatalf("create_mock errored: %s", out)
	}
	if !strings.Contains(out, `"status":201`) {
		t.Fatalf("create result = %s, want status 201", out)
	}
	list, isErr := executeMockTool("list_mocks", json.RawMessage(`{}`))
	if isErr {
		t.Fatalf("list_mocks errored: %s", list)
	}
	if !strings.Contains(list, "/api/login") || !strings.Contains(list, "POST") {
		t.Fatalf("list = %s, want the created mock", list)
	}

	// list_mocks is index-only; get_mock returns the body on demand.
	if strings.Contains(list, "token") {
		t.Fatalf("list_mocks should not include response bodies: %s", list)
	}
	got, isErr := executeMockTool("get_mock", json.RawMessage(`{"path":"/api/login"}`))
	if isErr {
		t.Fatalf("get_mock errored: %s", got)
	}
	if !strings.Contains(got, "token") || !strings.Contains(got, "\"status\":201") {
		t.Fatalf("get_mock = %s, want the response body + status", got)
	}
}

func TestCreateMockStoresRandomize(t *testing.T) {
	useTempDB(t)
	in := json.RawMessage(`{"method":"GET","endpoint":"/api/v1/random","response":"{\"id\":\"\",\"value\":\"\"}","randomize":{"id":{"type":"uuid"},"value":{"type":"word"}}}`)
	out, isErr := executeMockTool("create_mock", in)
	if isErr {
		t.Fatalf("create_mock errored: %s", out)
	}
	var stored core.Api
	if err := database.DBConn.Where("key = ?", "GETapi/v1/random").First(&stored).Error; err != nil {
		t.Fatalf("find created mock: %v", err)
	}
	if len(stored.Randomize) == 0 {
		t.Fatal("randomize config was not stored")
	}
	if !strings.Contains(string(stored.Randomize), "uuid") || !strings.Contains(string(stored.Randomize), "word") {
		t.Fatalf("randomize = %s, want uuid + word generators", stored.Randomize)
	}
	// The response body must NOT contain template placeholders.
	if strings.Contains(string(stored.Response), "{{") {
		t.Fatalf("response leaked template placeholders: %s", stored.Response)
	}
}
