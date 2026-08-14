package logger

import "testing"

// Guards against GetLast's manual field-by-field copy silently dropping a LogEntry field
// (as it did for ResponseHeaders before it was added).
func TestGetLastPreservesResponseHeaders(t *testing.T) {
	globalLogBuffer.Clear()

	LogRequest("GET", "/mocktail/orders", 200, "1ms", `{"ok":true}`, map[string]string{
		"X-Total-Count": "5",
		"Content-Type":  "application/json",
	})

	logs := globalLogBuffer.GetLast(10)
	if len(logs) == 0 {
		t.Fatal("expected at least one log entry")
	}
	last := logs[len(logs)-1]
	if last.ResponseHeaders["X-Total-Count"] != "5" {
		t.Errorf("ResponseHeaders dropped by GetLast: got %v", last.ResponseHeaders)
	}
	if last.ResponseBody != `{"ok":true}` || last.Status != 200 {
		t.Errorf("entry not preserved: body=%q status=%d", last.ResponseBody, last.Status)
	}
}
