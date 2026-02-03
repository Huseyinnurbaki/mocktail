package logger

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

// LogEntry represents a single log entry
type LogEntry struct {
	Timestamp string `json:"timestamp"`
	Message   string `json:"message"`
	Type      string `json:"type"` // "request", "system", "error"

	// For request logs
	Method       string `json:"method,omitempty"`
	Path         string `json:"path,omitempty"`
	Status       int    `json:"status,omitempty"`
	Duration     string `json:"duration,omitempty"`
	ResponseBody string `json:"responseBody,omitempty"`
}

// LogBuffer stores recent log entries in memory
type LogBuffer struct {
	entries []LogEntry
	maxSize int
	mu      sync.RWMutex
}

var globalLogBuffer *LogBuffer

func init() {
	globalLogBuffer = &LogBuffer{
		entries: make([]LogEntry, 0, 500),
		maxSize: 500,
	}
}

// Add a log entry to the buffer
func (lb *LogBuffer) Add(message string) {
	lb.mu.Lock()
	defer lb.mu.Unlock()

	entry := LogEntry{
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
		Message:   message,
	}

	lb.entries = append(lb.entries, entry)

	// Keep only last maxSize entries
	if len(lb.entries) > lb.maxSize {
		lb.entries = lb.entries[len(lb.entries)-lb.maxSize:]
	}
}

// GetAll returns all log entries
func (lb *LogBuffer) GetAll() []LogEntry {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	// Return a copy to prevent race conditions
	result := make([]LogEntry, len(lb.entries))
	copy(result, lb.entries)
	return result
}

// GetLast returns the last N log entries (deep copy to prevent mutation)
func (lb *LogBuffer) GetLast(n int) []LogEntry {
	lb.mu.RLock()
	defer lb.mu.RUnlock()

	var source []LogEntry
	if n <= 0 || n >= len(lb.entries) {
		source = lb.entries
	} else {
		source = lb.entries[len(lb.entries)-n:]
	}

	// Deep copy each entry to prevent mutation
	result := make([]LogEntry, len(source))
	for i, entry := range source {
		result[i] = LogEntry{
			Timestamp:    entry.Timestamp,
			Message:      entry.Message,
			Type:         entry.Type,
			Method:       entry.Method,
			Path:         entry.Path,
			Status:       entry.Status,
			Duration:     entry.Duration,
			ResponseBody: entry.ResponseBody,
		}
	}

	return result
}

// Clear removes all log entries
func (lb *LogBuffer) Clear() {
	lb.mu.Lock()
	defer lb.mu.Unlock()
	lb.entries = make([]LogEntry, 0, lb.maxSize)
}

// Add a log entry with full data
func (lb *LogBuffer) AddEntry(entry LogEntry) {
	lb.mu.Lock()
	defer lb.mu.Unlock()

	lb.entries = append(lb.entries, entry)

	// Keep only last maxSize entries
	if len(lb.entries) > lb.maxSize {
		lb.entries = lb.entries[len(lb.entries)-lb.maxSize:]
	}
}

// Log adds a log entry and prints to stdout (for system logs)
func Log(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	fmt.Println(message)
	globalLogBuffer.Add(message)
}

// LogRequest logs a full request/response with structured data
func LogRequest(method, path string, status int, duration, responseBody string) {
	// Use strings.Clone to force new string allocation (prevents buffer reuse)
	entry := LogEntry{
		Timestamp:    time.Now().Format("2006-01-02 15:04:05"),
		Type:         "request",
		Method:       strings.Clone(method),
		Path:         strings.Clone(path),
		Status:       status,
		Duration:     strings.Clone(duration),
		ResponseBody: strings.Clone(responseBody),
	}

	// Print summary to stdout
	if len(responseBody) > 150 {
		fmt.Printf("%s %s\n→ %d (%s) | %s...\n", method, path, status, duration, responseBody[:150])
	} else if len(responseBody) > 0 {
		fmt.Printf("%s %s\n→ %d (%s) | %s\n", method, path, status, duration, responseBody)
	} else {
		fmt.Printf("%s %s\n→ %d (%s)\n", method, path, status, duration)
	}

	globalLogBuffer.AddEntry(entry)
}

// GetGlobalBuffer returns the global log buffer
func GetGlobalBuffer() *LogBuffer {
	return globalLogBuffer
}
