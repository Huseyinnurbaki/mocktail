package core

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"mocktail-api/database"

	"github.com/gofiber/fiber/v2"
	"github.com/ncruces/go-sqlite3/gormlite"
	"gorm.io/gorm"
)

// setupDB gives each test a fresh in-memory SQLite DB (pure-Go driver) with the schema migrated.
func setupDB(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(gormlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open in-memory db: %v", err)
	}
	if err := db.AutoMigrate(&Api{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	database.DBConn = db
}

func testApp() *fiber.App {
	app := fiber.New()
	app.Get("/apis", GetApis)
	app.Post("/api", CreateApi)
	app.Put("/api/:id", UpdateApi)
	app.Delete("/api/:id", DeleteApiByKey)
	app.Post("/import", ImportApis)
	app.Post("/preview", PreviewApi)
	return app
}

// do issues a request with an optional JSON body and returns (status, rawBody).
func do(t *testing.T, app *fiber.App, method, path string, body any) (int, []byte) {
	t.Helper()
	var r io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		r = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, r)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("%s %s: %v", method, path, err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, data
}

func TestCreateAndGet(t *testing.T) {
	setupDB(t)
	app := testApp()

	status, body := do(t, app, "POST", "/api", map[string]any{
		"Endpoint": "/api/v1/users",
		"Method":   "GET",
		"Response": map[string]any{"ok": true},
	})
	if status != 200 {
		t.Fatalf("create status = %d, body=%s", status, body)
	}

	var created Api
	if err := json.Unmarshal(body, &created); err != nil {
		t.Fatalf("unmarshal created: %v", err)
	}
	if created.ID == 0 {
		t.Error("expected non-zero ID")
	}
	if created.Endpoint != "api/v1/users" {
		t.Errorf("endpoint = %q, want normalized 'api/v1/users' (leading slash stripped)", created.Endpoint)
	}
	if created.Key != "GETapi/v1/users" {
		t.Errorf("key = %q, want 'GETapi/v1/users'", created.Key)
	}
	if created.StatusCode != 200 {
		t.Errorf("status = %d, want default 200", created.StatusCode)
	}

	status, body = do(t, app, "GET", "/apis", nil)
	if status != 200 {
		t.Fatalf("list status = %d", status)
	}
	var list []Api
	if err := json.Unmarshal(body, &list); err != nil {
		t.Fatalf("unmarshal list: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("list len = %d, want 1", len(list))
	}
}

func TestCreateDelayCapAndStatusDefault(t *testing.T) {
	setupDB(t)
	app := testApp()

	_, body := do(t, app, "POST", "/api", map[string]any{
		"Endpoint": "/x", "Method": "GET", "Response": map[string]any{"a": 1},
		"Delay": 99999, "StatusCode": 0,
	})
	var a Api
	if err := json.Unmarshal(body, &a); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if a.Delay != 30000 {
		t.Errorf("delay = %d, want capped 30000", a.Delay)
	}
	if a.StatusCode != 200 {
		t.Errorf("status = %d, want default 200", a.StatusCode)
	}
}

func TestCreateInvalidMethod(t *testing.T) {
	setupDB(t)
	app := testApp()

	status, _ := do(t, app, "POST", "/api", map[string]any{
		"Endpoint": "/x", "Method": "FETCH", "Response": map[string]any{"a": 1},
	})
	if status != 400 {
		t.Errorf("status = %d, want 400 for invalid method", status)
	}
}

func TestCreateDuplicateKeyFails(t *testing.T) {
	setupDB(t)
	app := testApp()

	payload := map[string]any{"Endpoint": "/dup", "Method": "GET", "Response": map[string]any{"a": 1}}
	if s, _ := do(t, app, "POST", "/api", payload); s != 200 {
		t.Fatalf("first create status = %d", s)
	}
	if s, _ := do(t, app, "POST", "/api", payload); s != 400 {
		t.Errorf("duplicate create status = %d, want 400 (unique key)", s)
	}
}

func TestUpdate(t *testing.T) {
	setupDB(t)
	app := testApp()

	_, body := do(t, app, "POST", "/api", map[string]any{
		"Endpoint": "/u", "Method": "GET", "Response": map[string]any{"a": 1},
	})
	var created Api
	if err := json.Unmarshal(body, &created); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	status, body := do(t, app, "PUT", fmt.Sprintf("/api/%d", created.ID), map[string]any{
		"Endpoint": "/u", "Method": "POST", "StatusCode": 201, "Response": map[string]any{"b": 2},
	})
	if status != 200 {
		t.Fatalf("update status = %d, body=%s", status, body)
	}
	var updated Api
	if err := json.Unmarshal(body, &updated); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if updated.Method != "POST" || updated.StatusCode != 201 {
		t.Errorf("update didn't apply: method=%s status=%d", updated.Method, updated.StatusCode)
	}
	if updated.Key != "POSTu" {
		t.Errorf("key = %q, want 'POSTu'", updated.Key)
	}
}

func TestUpdateNotFound(t *testing.T) {
	setupDB(t)
	app := testApp()

	status, _ := do(t, app, "PUT", "/api/9999", map[string]any{
		"Endpoint": "/x", "Method": "GET", "Response": map[string]any{"a": 1},
	})
	if status != 404 {
		t.Errorf("status = %d, want 404", status)
	}
}

func TestDelete(t *testing.T) {
	setupDB(t)
	app := testApp()

	_, body := do(t, app, "POST", "/api", map[string]any{
		"Endpoint": "/d", "Method": "GET", "Response": map[string]any{"a": 1},
	})
	var created Api
	if err := json.Unmarshal(body, &created); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if s, _ := do(t, app, "DELETE", fmt.Sprintf("/api/%d", created.ID), nil); s != 200 {
		t.Fatalf("delete status = %d", s)
	}

	_, body = do(t, app, "GET", "/apis", nil)
	var list []Api
	if err := json.Unmarshal(body, &list); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(list) != 0 {
		t.Errorf("list len = %d after delete, want 0", len(list))
	}
}

func TestImportSkipsExistingAndKeepsRandomize(t *testing.T) {
	setupDB(t)
	app := testApp()

	payload := map[string]any{
		"Apis": []map[string]any{
			{
				"Endpoint":  "/a",
				"Method":    "GET",
				"Response":  map[string]any{"x": 1},
				"Randomize": map[string]any{"x": map[string]any{"type": "uuid"}},
			},
			{"Endpoint": "/b", "Method": "POST", "Response": map[string]any{"y": 2}},
		},
	}

	_, body := do(t, app, "POST", "/import", payload)
	var res ImportResult
	if err := json.Unmarshal(body, &res); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if res.Imported != 2 || res.Skipped != 0 {
		t.Fatalf("first import: imported=%d skipped=%d, want 2/0", res.Imported, res.Skipped)
	}

	// Re-import the same set — existing keys must be skipped, not overwritten.
	_, body = do(t, app, "POST", "/import", payload)
	if err := json.Unmarshal(body, &res); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if res.Imported != 0 || res.Skipped != 2 {
		t.Errorf("re-import: imported=%d skipped=%d, want 0/2", res.Imported, res.Skipped)
	}

	// Randomize must survive the import round-trip (the bug we fixed earlier).
	_, body = do(t, app, "GET", "/apis", nil)
	var list []Api
	if err := json.Unmarshal(body, &list); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	found := false
	for _, a := range list {
		if a.Key == "GETa" {
			found = true
			if len(a.Randomize) == 0 || !strings.Contains(string(a.Randomize), "uuid") {
				t.Errorf("Randomize not persisted on import: %q", string(a.Randomize))
			}
		}
	}
	if !found {
		t.Error("imported api /a not found")
	}
}

func TestImportKeepsHeaders(t *testing.T) {
	setupDB(t)
	app := testApp()

	payload := map[string]any{
		"Apis": []map[string]any{
			{
				"Endpoint": "/h",
				"Method":   "GET",
				"Response": map[string]any{"ok": true},
				"Headers":  map[string]any{"X-Total-Count": "7"},
			},
		},
	}
	do(t, app, "POST", "/import", payload)

	_, body := do(t, app, "GET", "/apis", nil)
	var list []Api
	if err := json.Unmarshal(body, &list); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	found := false
	for _, a := range list {
		if a.Key == "GETh" {
			found = true
			if !strings.Contains(string(a.Headers), "X-Total-Count") {
				t.Errorf("Headers not persisted on import: %q", string(a.Headers))
			}
		}
	}
	if !found {
		t.Error("imported /h not found")
	}
}

func TestUpdateSetsHeaders(t *testing.T) {
	setupDB(t)
	app := testApp()

	_, body := do(t, app, "POST", "/api", map[string]any{
		"Endpoint": "/uh", "Method": "GET", "Response": map[string]any{"a": 1},
	})
	var created Api
	if err := json.Unmarshal(body, &created); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	_, body = do(t, app, "PUT", fmt.Sprintf("/api/%d", created.ID), map[string]any{
		"Endpoint": "/uh", "Method": "GET", "Response": map[string]any{"a": 1},
		"Headers": map[string]any{"Cache-Control": "no-store"},
	})
	var updated Api
	if err := json.Unmarshal(body, &updated); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !strings.Contains(string(updated.Headers), "no-store") {
		t.Errorf("Headers not updated: %q", string(updated.Headers))
	}
}

func TestPreviewAppliesFixed(t *testing.T) {
	setupDB(t)
	app := testApp()

	_, body := do(t, app, "POST", "/preview", map[string]any{
		"Response":  map[string]any{"name": "orig"},
		"Randomize": map[string]any{"name": map[string]any{"type": "fixed", "value": "FIXED"}},
	})
	var out map[string]any
	if err := json.Unmarshal(body, &out); err != nil {
		t.Fatalf("unmarshal preview: %v", err)
	}
	if out["name"] != "FIXED" {
		t.Errorf("preview name = %v, want FIXED", out["name"])
	}
}
