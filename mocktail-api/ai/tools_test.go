package ai

// Guardrail tests for the tool surface the assistant can invoke. The model (or a hostile prompt
// steering it) must not be able to persist a broken mock, escape the delay cap, hit an unknown
// tool, act with no DB, or smuggle SQL through an argument.

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"

	"mocktail-api/core"
	"mocktail-api/database"
)

func callTool(name, input string) (string, bool) {
	return executeMockTool(name, json.RawMessage(input))
}

// mustErr asserts a tool call is rejected and the message mentions want.
func mustErr(t *testing.T, name, input, want string) {
	t.Helper()
	out, isErr := callTool(name, input)
	if !isErr {
		t.Fatalf("%s(%s): expected rejection, got success: %s", name, input, out)
	}
	if want != "" && !strings.Contains(strings.ToLower(out), strings.ToLower(want)) {
		t.Fatalf("%s(%s): error %q should mention %q", name, input, out, want)
	}
}

func TestToolGuardrails(t *testing.T) {
	useTempDB(t)

	t.Run("create rejects invalid method", func(t *testing.T) {
		mustErr(t, "create_mock", `{"method":"FETCH","endpoint":"/x","response":"{}"}`, "method")
	})
	t.Run("create rejects empty endpoint", func(t *testing.T) {
		mustErr(t, "create_mock", `{"method":"GET","endpoint":"/","response":"{}"}`, "endpoint")
		mustErr(t, "create_mock", `{"method":"GET","endpoint":"","response":"{}"}`, "endpoint")
	})
	t.Run("create rejects out-of-range delay", func(t *testing.T) {
		mustErr(t, "create_mock", `{"method":"GET","endpoint":"/x","response":"{}","delay":-5}`, "delay")
		mustErr(t, "create_mock", `{"method":"GET","endpoint":"/x","response":"{}","delay":45000}`, "30000")
	})

	// Seed one valid mock for the update/get/delete cases.
	if _, isErr := callTool("create_mock", `{"method":"GET","endpoint":"/seed","response":"{\"ok\":true}"}`); isErr {
		t.Fatal("seed create failed")
	}
	var seed core.Api
	database.DBConn.Where("key = ?", "GETseed").First(&seed)

	t.Run("update rejects invalid method", func(t *testing.T) {
		mustErr(t, "update_mock", fmt.Sprintf(`{"id":%d,"method":"NUKE","endpoint":"/seed","response":"{}"}`, seed.ID), "method")
	})
	t.Run("update rejects out-of-range delay", func(t *testing.T) {
		mustErr(t, "update_mock", fmt.Sprintf(`{"id":%d,"method":"GET","endpoint":"/seed","response":"{}","delay":99999}`, seed.ID), "30000")
	})
	t.Run("update rejects unknown id", func(t *testing.T) {
		mustErr(t, "update_mock", `{"id":999999,"method":"GET","endpoint":"/nope","response":"{}"}`, "not found")
	})

	t.Run("get_mock needs id or path", func(t *testing.T) {
		mustErr(t, "get_mock", `{}`, "id or path")
	})
	t.Run("get_mock unknown returns error", func(t *testing.T) {
		mustErr(t, "get_mock", `{"path":"/does-not-exist"}`, "no matching")
	})

	t.Run("delete of an unknown id errors (no silent no-op)", func(t *testing.T) {
		mustErr(t, "delete_mock", `{"id":424242}`, "nothing deleted")
	})

	t.Run("unknown tool rejected", func(t *testing.T) {
		mustErr(t, "drop_everything", `{}`, "unknown tool")
	})

	// After every bad call, only the one seeded mock exists — nothing broken was persisted,
	// and the safe no-op delete didn't remove it.
	var count int64
	database.DBConn.Model(&core.Api{}).Count(&count)
	if count != 1 {
		t.Fatalf("expected only the seed mock to persist, got %d", count)
	}
}

func TestToolsRejectWhenNoDB(t *testing.T) {
	orig := database.DBConn
	database.DBConn = nil
	t.Cleanup(func() { database.DBConn = orig })
	for _, name := range []string{"list_mocks", "get_mock", "create_mock", "update_mock", "delete_mock"} {
		if out, isErr := executeMockTool(name, json.RawMessage(`{}`)); !isErr || !strings.Contains(out, "unavailable") {
			t.Fatalf("%s with no DB: want unavailable error, got (%q, %v)", name, out, isErr)
		}
	}
}

// SQL-injection-style input is parameterized by GORM — treated as a literal, never executed.
func TestToolInputIsParameterized(t *testing.T) {
	useTempDB(t)
	callTool("create_mock", `{"method":"GET","endpoint":"/safe","response":"{}"}`)

	out, isErr := callTool("get_mock", `{"path":"/'; DROP TABLE apis;--"}`)
	if !isErr || !strings.Contains(out, "no matching") {
		t.Fatalf("hostile path: want no-match, got (%q, %v)", out, isErr)
	}
	// The table and the mock both survive.
	var count int64
	if err := database.DBConn.Model(&core.Api{}).Count(&count).Error; err != nil {
		t.Fatalf("apis table should still exist: %v", err)
	}
	if count != 1 {
		t.Fatalf("mock should survive the injection attempt, count=%d", count)
	}
}
