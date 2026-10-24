package logger

import (
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"
)

// LogEntry represents a single log entry
type LogEntry struct {
	// ID is assigned on insert and only ever increases (also across Clear), so clients can poll
	// incrementally with ?after=<id> and key rows stably while old entries are evicted.
	ID        uint64 `json:"id"`
	Timestamp string `json:"timestamp"`
	Message   string `json:"message"`
	Type      string `json:"type"` // "request", "system", "error"

	// For request logs
	Method   string `json:"method,omitempty"`
	Path     string `json:"path,omitempty"`
	Status   int    `json:"status,omitempty"`
	Duration string `json:"duration,omitempty"`

	// What the client sent. RequestSize is the full body size; RequestBody may hold less when
	// RequestTruncated (same cap as responses). Query is the raw query string, without "?".
	RequestQuery     string            `json:"requestQuery,omitempty"`
	RequestSize      int               `json:"requestSize,omitempty"`
	RequestTruncated bool              `json:"requestTruncated,omitempty"`
	RequestBody      string            `json:"requestBody,omitempty"`
	RequestHeaders   map[string]string `json:"requestHeaders,omitempty"`

	// ResponseSize is the full body size served; ResponseBody may hold less when Truncated.
	ResponseSize      int               `json:"responseSize,omitempty"`
	ResponseTruncated bool              `json:"responseTruncated,omitempty"`
	ResponseBody      string            `json:"responseBody,omitempty"`
	ResponseHeaders   map[string]string `json:"responseHeaders,omitempty"`
}

// Summary is the entry without its (potentially large) bodies, headers and query — what list
// polling returns. The full entry is fetched by ID on demand.
func (e LogEntry) Summary() LogEntry {
	e.RequestQuery = ""
	e.RequestBody = ""
	e.RequestHeaders = nil
	e.ResponseBody = ""
	e.ResponseHeaders = nil
	return e
}

// entryOverhead approximates the per-entry bookkeeping (struct, map, slice slot) so a flood of
// tiny requests is still bounded by the byte budget, not just the bodies.
const entryOverhead = 512

// size is the approximate memory an entry holds, counted against the buffer's byte budget.
func (e *LogEntry) size() int64 {
	n := entryOverhead + len(e.Timestamp) + len(e.Message) + len(e.Type) + len(e.Method) +
		len(e.Path) + len(e.Duration) + len(e.RequestQuery) + len(e.RequestBody) + len(e.ResponseBody)
	for _, h := range []map[string]string{e.RequestHeaders, e.ResponseHeaders} {
		for k, v := range h {
			n += len(k) + len(v)
		}
	}
	return int64(n)
}

const (
	defaultBufferMB = 64   // MOCKTAIL_LOG_BUFFER_MB
	defaultBodyKB   = 1024 // MOCKTAIL_LOG_BODY_KB
)

// LogBuffer stores recent log entries in memory, evicting the oldest once their combined size
// exceeds maxBytes. Bodies over maxBody bytes are truncated before they're stored.
type LogBuffer struct {
	entries  []LogEntry
	bytes    int64
	maxBytes int64
	maxBody  int
	nextID   uint64
	mu       sync.RWMutex
}

var globalLogBuffer *LogBuffer

// Epoch identifies this process's buffer. IDs restart when the server does, so clients reset
// their incremental cursor when the epoch they last saw changes.
var Epoch = strconv.FormatInt(time.Now().UnixNano(), 36)

func init() {
	bufferMB, bufErr := envInt("MOCKTAIL_LOG_BUFFER_MB", defaultBufferMB)
	bodyKB, bodyErr := envInt("MOCKTAIL_LOG_BODY_KB", defaultBodyKB)
	globalLogBuffer = NewLogBuffer(int64(bufferMB)<<20, bodyKB<<10)
	for _, err := range []error{bufErr, bodyErr} {
		if err != nil {
			Log("%v", err)
		}
	}
}

// envInt reads a positive integer env var, falling back to def (with an error to report) when
// it's set but invalid.
func envInt(name string, def int) (int, error) {
	raw := os.Getenv(name)
	if raw == "" {
		return def, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return def, fmt.Errorf("Invalid %s=%q (want a positive integer) — using %d", name, raw, def)
	}
	return n, nil
}

// NewLogBuffer creates a buffer holding up to maxBytes of entries, truncating bodies to maxBody.
func NewLogBuffer(maxBytes int64, maxBody int) *LogBuffer {
	return &LogBuffer{maxBytes: maxBytes, maxBody: maxBody, nextID: 1}
}

// Add a log entry to the buffer
func (lb *LogBuffer) Add(message string) {
	lb.AddEntry(LogEntry{
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
		Message:   message,
	})
}

// GetAll returns all log entries
func (lb *LogBuffer) GetAll() []LogEntry {
	return lb.GetLast(0)
}

// GetLast returns the last N full log entries (n <= 0 means all). Entries are never mutated
// after insert, so copying the structs is enough to hand them out safely.
func (lb *LogBuffer) GetLast(n int) []LogEntry {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	source := lb.entries
	if n > 0 && n < len(source) {
		source = source[len(source)-n:]
	}
	return append([]LogEntry(nil), source...)
}

// Since returns summaries (no bodies/headers) of entries with ID > after, oldest first, capped
// to the newest limit of them (limit <= 0 means no cap).
func (lb *LogBuffer) Since(after uint64, limit int) []LogEntry {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	start := sort.Search(len(lb.entries), func(i int) bool { return lb.entries[i].ID > after })
	if limit > 0 && len(lb.entries)-start > limit {
		start = len(lb.entries) - limit
	}
	result := make([]LogEntry, 0, len(lb.entries)-start)
	for _, e := range lb.entries[start:] {
		result = append(result, e.Summary())
	}
	return result
}

// Get returns the full entry with the given ID, or false if it was never logged or was evicted.
func (lb *LogBuffer) Get(id uint64) (LogEntry, bool) {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	i := sort.Search(len(lb.entries), func(i int) bool { return lb.entries[i].ID >= id })
	if i < len(lb.entries) && lb.entries[i].ID == id {
		return lb.entries[i], true
	}
	return LogEntry{}, false
}

// FirstID is the ID of the oldest entry still held — or, when empty, the ID the next entry will
// get. Clients drop anything older, which mirrors server-side eviction and Clear.
func (lb *LogBuffer) FirstID() uint64 {
	lb.mu.RLock()
	defer lb.mu.RUnlock()
	if len(lb.entries) == 0 {
		return lb.nextID
	}
	return lb.entries[0].ID
}

// Bytes reports the approximate memory held by the buffer's entries.
func (lb *LogBuffer) Bytes() int64 {
	lb.mu.RLock()
	defer lb.mu.RUnlock()
	return lb.bytes
}

// Clear removes all log entries. IDs keep counting so clients' ?after= cursors stay valid.
func (lb *LogBuffer) Clear() {
	lb.mu.Lock()
	defer lb.mu.Unlock()
	lb.entries = nil
	lb.bytes = 0
}

// AddEntry assigns the entry an ID, stores it, and evicts the oldest entries until the buffer is
// back under its byte budget (always keeping the newest, even if it alone exceeds the budget).
func (lb *LogBuffer) AddEntry(entry LogEntry) {
	lb.mu.Lock()
	defer lb.mu.Unlock()

	entry.ID = lb.nextID
	lb.nextID++
	lb.entries = append(lb.entries, entry)
	lb.bytes += entry.size()

	evict := 0
	for lb.bytes > lb.maxBytes && evict < len(lb.entries)-1 {
		lb.bytes -= lb.entries[evict].size()
		lb.entries[evict] = LogEntry{} // release the body now, not when the backing array is reallocated
		evict++
	}
	lb.entries = lb.entries[evict:]
}

// truncateBody copies at most maxBody bytes of b, backing off to a UTF-8 rune boundary so a
// truncated body never ends in a broken character.
func truncateBody(b []byte, maxBody int) (body string, truncated bool) {
	if len(b) <= maxBody {
		return string(b), false
	}
	cut := maxBody
	for cut > 0 && cut > maxBody-utf8.UTFMax && !utf8.RuneStart(b[cut]) {
		cut--
	}
	return string(b[:cut]), true
}

// Log adds a log entry and prints to stdout (for system logs)
func Log(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	fmt.Println(message)
	globalLogBuffer.Add(message)
}

// Exchange is one served request and its response, as handed to LogRequest. Byte slices may be
// Fiber's reusable buffers: LogRequest copies (and size-caps) them before returning.
type Exchange struct {
	Method          string
	Path            string
	Query           string
	Status          int
	Duration        string
	RequestHeaders  map[string]string
	RequestBody     []byte
	ResponseHeaders map[string]string
	ResponseBody    []byte
}

// LogRequest logs a full request/response with structured data.
func LogRequest(x Exchange) {
	globalLogBuffer.logRequest(x)
}

func (lb *LogBuffer) logRequest(x Exchange) {
	reqBody, reqTruncated := truncateBody(x.RequestBody, lb.maxBody)
	respBody, respTruncated := truncateBody(x.ResponseBody, lb.maxBody)
	entry := LogEntry{
		Timestamp:         time.Now().Format("2006-01-02 15:04:05"),
		Type:              "request",
		Method:            strings.Clone(x.Method), // force fresh allocations — never alias Fiber's reused buffers
		Path:              strings.Clone(x.Path),
		Status:            x.Status,
		Duration:          strings.Clone(x.Duration),
		RequestQuery:      strings.Clone(x.Query),
		RequestSize:       len(x.RequestBody),
		RequestTruncated:  reqTruncated,
		RequestBody:       reqBody,
		RequestHeaders:    x.RequestHeaders,
		ResponseSize:      len(x.ResponseBody),
		ResponseTruncated: respTruncated,
		ResponseBody:      respBody,
		ResponseHeaders:   x.ResponseHeaders,
	}

	// Print summary to stdout
	method, path, status, duration := x.Method, x.Path, x.Status, x.Duration
	if len(respBody) > 150 {
		fmt.Printf("%s %s\n→ %d (%s) | %s...\n", method, path, status, duration, respBody[:150])
	} else if len(respBody) > 0 {
		fmt.Printf("%s %s\n→ %d (%s) | %s\n", method, path, status, duration, respBody)
	} else {
		fmt.Printf("%s %s\n→ %d (%s)\n", method, path, status, duration)
	}

	lb.AddEntry(entry)
}

// GetGlobalBuffer returns the global log buffer
func GetGlobalBuffer() *LogBuffer {
	return globalLogBuffer
}
