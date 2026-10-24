package logger

import (
	"strings"
	"testing"
	"unicode/utf8"
)

// Guards against GetLast silently dropping a LogEntry field (as a manual field-by-field copy
// once did for ResponseHeaders).
func TestGetLastPreservesResponseHeaders(t *testing.T) {
	globalLogBuffer.Clear()

	LogRequest(Exchange{Method: "GET", Path: "/mocktail/orders", Status: 200, Duration: "1ms", ResponseBody: []byte(`{"ok":true}`), ResponseHeaders: map[string]string{
		"X-Total-Count": "5",
		"Content-Type":  "application/json",
	}})

	logs := globalLogBuffer.GetLast(10)
	if len(logs) == 0 {
		t.Fatal("expected at least one log entry")
	}
	last := logs[len(logs)-1]
	if last.ResponseHeaders["X-Total-Count"] != "5" {
		t.Errorf("ResponseHeaders dropped by GetLast: got %v", last.ResponseHeaders)
	}
	if last.ResponseBody != `{"ok":true}` || last.Status != 200 || last.ResponseSize != 11 {
		t.Errorf("entry not preserved: body=%q status=%d size=%d", last.ResponseBody, last.Status, last.ResponseSize)
	}
}

// LogRequest must copy the body: Fiber reuses its response buffer for the next request.
func TestLogRequestCopiesBody(t *testing.T) {
	lb := NewLogBuffer(1<<20, 1<<10)
	buf := []byte(`{"a":1}`)
	lb.logRequest(Exchange{Method: "GET", Path: "/mocktail/x", Status: 200, Duration: "1ms", ResponseBody: buf})
	copy(buf, `{"b":2}`)

	if got := lb.GetAll()[0].ResponseBody; got != `{"a":1}` {
		t.Errorf("stored body aliased the caller's buffer: %q", got)
	}
}

func TestIDsIncreaseAcrossClear(t *testing.T) {
	lb := NewLogBuffer(1<<20, 1<<10)
	lb.Add("one")
	lb.Add("two")
	lb.Clear()
	if got := lb.FirstID(); got != 3 {
		t.Errorf("FirstID of an empty buffer should be the next ID (3), got %d", got)
	}
	lb.Add("three")

	all := lb.GetAll()
	if len(all) != 1 || all[0].ID != 3 {
		t.Fatalf("expected one entry with ID 3 after Clear, got %+v", all)
	}
}

func TestEvictsOldestOverByteBudget(t *testing.T) {
	body := []byte(strings.Repeat("x", 1000))
	// Room for ~3 entries of (1000 + overhead + small fields).
	lb := NewLogBuffer(3*(1000+entryOverhead+64), 1<<20)
	for i := 0; i < 10; i++ {
		lb.logRequest(Exchange{Method: "GET", Path: "/mocktail/x", Status: 200, Duration: "1ms", ResponseBody: body})
	}

	all := lb.GetAll()
	if len(all) != 3 {
		t.Fatalf("expected 3 entries under the budget, got %d", len(all))
	}
	if all[0].ID != 8 || all[2].ID != 10 {
		t.Errorf("expected the newest entries (8..10) to survive, got IDs %d..%d", all[0].ID, all[2].ID)
	}
	if lb.Bytes() > lb.maxBytes {
		t.Errorf("buffer holds %d bytes, over its %d budget", lb.Bytes(), lb.maxBytes)
	}
	if got := lb.FirstID(); got != 8 {
		t.Errorf("FirstID should track eviction: got %d, want 8", got)
	}
}

// Tiny entries are counted via entryOverhead, so a flood of bodiless requests is bounded too.
func TestEvictsTinyEntriesByOverhead(t *testing.T) {
	lb := NewLogBuffer(10*entryOverhead, 1<<20)
	for i := 0; i < 1000; i++ {
		lb.logRequest(Exchange{Method: "GET", Path: "/", Status: 204, Duration: "0s"})
	}
	if n := len(lb.GetAll()); n >= 10 || n == 0 {
		t.Errorf("expected fewer than 10 tiny entries under a 10×overhead budget, got %d", n)
	}
}

func TestKeepsNewestEntryEvenIfOverBudget(t *testing.T) {
	lb := NewLogBuffer(100, 1<<20)
	lb.logRequest(Exchange{Method: "GET", Path: "/a", Status: 200, Duration: "1ms", ResponseBody: []byte(strings.Repeat("x", 5000))})
	lb.logRequest(Exchange{Method: "GET", Path: "/b", Status: 200, Duration: "1ms", ResponseBody: []byte(strings.Repeat("y", 5000))})

	all := lb.GetAll()
	if len(all) != 1 || all[0].Path != "/b" {
		t.Fatalf("expected only the newest oversized entry to be kept, got %d entries", len(all))
	}
}

func TestTruncatesBodyOverLimit(t *testing.T) {
	lb := NewLogBuffer(1<<20, 100)
	lb.logRequest(Exchange{Method: "GET", Path: "/big", Status: 200, Duration: "1ms", ResponseBody: []byte(strings.Repeat("a", 250))})
	lb.logRequest(Exchange{Method: "GET", Path: "/small", Status: 200, Duration: "1ms", ResponseBody: []byte("ok")})

	all := lb.GetAll()
	big, small := all[0], all[1]
	if len(big.ResponseBody) != 100 || !big.ResponseTruncated || big.ResponseSize != 250 {
		t.Errorf("big: len=%d truncated=%v size=%d, want 100/true/250",
			len(big.ResponseBody), big.ResponseTruncated, big.ResponseSize)
	}
	if small.ResponseTruncated || small.ResponseBody != "ok" || small.ResponseSize != 2 {
		t.Errorf("small body should be stored as-is: %+v", small)
	}
}

func TestTruncateBodyKeepsValidUTF8(t *testing.T) {
	// "é" is 2 bytes and "😀" is 4: a cut at 5 lands mid-emoji and must back off to 4.
	body, truncated := truncateBody([]byte("éé😀tail"), 5)
	if !truncated || body != "éé" || !utf8.ValidString(body) {
		t.Errorf("got %q (truncated=%v), want \"éé\"", body, truncated)
	}
}

func TestSinceReturnsSummariesAfterCursor(t *testing.T) {
	lb := NewLogBuffer(1<<20, 1<<10)
	for i := 0; i < 5; i++ {
		lb.logRequest(Exchange{Method: "POST", Path: "/mocktail/x", Status: 201, Duration: "1ms", ResponseBody: []byte(`{"id":1}`), ResponseHeaders: map[string]string{"X": "y"}})
	}

	got := lb.Since(2, 0)
	if len(got) != 3 || got[0].ID != 3 || got[2].ID != 5 {
		t.Fatalf("Since(2) should return IDs 3..5 oldest first, got %+v", got)
	}
	for _, e := range got {
		if e.ResponseBody != "" || e.ResponseHeaders != nil {
			t.Errorf("summary %d leaked body/headers: %+v", e.ID, e)
		}
		if e.ResponseSize != 8 || e.Method != "POST" || e.Status != 201 {
			t.Errorf("summary %d lost list fields: %+v", e.ID, e)
		}
	}

	// The stored entry itself must keep its body.
	if full, _ := lb.Get(3); full.ResponseBody != `{"id":1}` || full.ResponseHeaders["X"] != "y" {
		t.Errorf("Summary mutated the stored entry: %+v", full)
	}

	if got := lb.Since(5, 0); len(got) != 0 {
		t.Errorf("Since(latest) should be empty, got %d", len(got))
	}
}

func TestSinceLimitKeepsNewest(t *testing.T) {
	lb := NewLogBuffer(1<<20, 1<<10)
	for i := 0; i < 10; i++ {
		lb.Add("m")
	}
	got := lb.Since(0, 3)
	if len(got) != 3 || got[0].ID != 8 || got[2].ID != 10 {
		t.Errorf("Since(0, 3) should return the newest three (8..10), got %+v", got)
	}
}

func TestGetByID(t *testing.T) {
	lb := NewLogBuffer(2*(entryOverhead+64), 1<<10)
	for i := 0; i < 5; i++ {
		lb.Add("m")
	}

	if e, ok := lb.Get(5); !ok || e.ID != 5 {
		t.Errorf("Get(5) = %+v, %v", e, ok)
	}
	if _, ok := lb.Get(1); ok {
		t.Error("Get(1) should miss: evicted")
	}
	if _, ok := lb.Get(99); ok {
		t.Error("Get(99) should miss: never logged")
	}
}

func TestEnvInt(t *testing.T) {
	d := defaultBufferMB
	cases := []struct {
		val     string
		want    int
		wantErr bool
	}{
		{"", d, false},
		{"32", 32, false},
		{"0", d, true},
		{"-5", d, true},
		{"lots", d, true},
	}
	for _, c := range cases {
		t.Setenv("MOCKTAIL_LOG_BUFFER_MB", c.val)
		got, err := envInt("MOCKTAIL_LOG_BUFFER_MB", d)
		if got != c.want || (err != nil) != c.wantErr {
			t.Errorf("envInt(%q) = %d, %v; want %d, err=%v", c.val, got, err, c.want, c.wantErr)
		}
	}
}

func TestRequestSideCapturedCappedAndCopied(t *testing.T) {
	lb := NewLogBuffer(1<<20, 10)
	reqBody := []byte(`{"name":"long enough"}`)
	lb.logRequest(Exchange{
		Method: "POST", Path: "/mocktail/users", Query: "page=2", Status: 201, Duration: "1ms",
		RequestHeaders: map[string]string{"Content-Type": "application/json"},
		RequestBody:    reqBody,
		ResponseBody:   []byte(`{}`),
	})
	copy(reqBody, "XXXXXXXXXX") // Fiber reuses the request buffer too

	e := lb.GetAll()[0]
	if e.RequestBody != `{"name":"l` || !e.RequestTruncated || e.RequestSize != len(reqBody) {
		t.Errorf("request body: %q truncated=%v size=%d", e.RequestBody, e.RequestTruncated, e.RequestSize)
	}
	if e.RequestQuery != "page=2" || e.RequestHeaders["Content-Type"] != "application/json" {
		t.Errorf("query/headers lost: %+v", e)
	}
	if e.ResponseTruncated || e.ResponseBody != "{}" {
		t.Errorf("response side affected: %+v", e)
	}
}

func TestSummaryDropsRequestDetail(t *testing.T) {
	e := LogEntry{
		ID: 1, Method: "POST", RequestQuery: "a=1", RequestSize: 3, RequestTruncated: true,
		RequestBody: "abc", RequestHeaders: map[string]string{"A": "b"},
	}.Summary()
	if e.RequestBody != "" || e.RequestHeaders != nil || e.RequestQuery != "" {
		t.Errorf("summary leaked request detail: %+v", e)
	}
	if e.RequestSize != 3 || !e.RequestTruncated {
		t.Errorf("summary must keep request size/truncation for the tab label: %+v", e)
	}
}

// Request bodies count against the byte budget just like responses.
func TestRequestBodiesCountTowardBudget(t *testing.T) {
	small := LogEntry{}
	withBody := LogEntry{RequestBody: strings.Repeat("x", 1000), RequestHeaders: map[string]string{"K": "vv"}}
	if got := withBody.size() - small.size(); got != 1003 {
		t.Errorf("request body+headers should add 1003 bytes, added %d", got)
	}
}
