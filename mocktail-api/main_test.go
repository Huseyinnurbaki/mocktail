package main

// Integration tests for startup wiring: DB path resolution, database init/migrate,
// persistence across reopen, port resolution, and a full boot smoke test that stands
// up a real listener and drives a mock end-to-end. These exercise the glue in main.go
// that the per-package unit tests (core, mocktail, logger) don't touch.

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"mocktail-api/core"
	"mocktail-api/database"

	"github.com/gofiber/fiber/v2"
	"github.com/ncruces/go-sqlite3/gormlite"
	"gorm.io/gorm"
)

// freePort grabs an OS-assigned port, then releases it so a caller can (racily but
// reliably in practice) rebind it. Used to test the fixed-port paths without hard-coding.
func freePort(t *testing.T) int {
	t.Helper()
	ln, err := net.Listen("tcp", ":0")
	if err != nil {
		t.Fatalf("reserve free port: %v", err)
	}
	p := ln.Addr().(*net.TCPAddr).Port
	_ = ln.Close()
	return p
}

func TestResolveDBPath(t *testing.T) {
	t.Run("explicit MOCKTAIL_DB_PATH wins", func(t *testing.T) {
		want := filepath.Join(t.TempDir(), "custom", "apis.db")
		t.Setenv("MOCKTAIL_DB_PATH", want)
		if got := resolveDBPath(); got != want {
			t.Fatalf("resolveDBPath() = %q, want %q", got, want)
		}
	})

	t.Run("app-data dir when no override", func(t *testing.T) {
		t.Setenv("MOCKTAIL_DB_PATH", "")
		got := resolveDBPath()
		suffix := filepath.Join("mocktail", "apis.db")
		if !strings.HasSuffix(got, suffix) {
			t.Fatalf("resolveDBPath() = %q, want suffix %q", got, suffix)
		}
		if !filepath.IsAbs(got) {
			t.Fatalf("resolveDBPath() = %q, want an absolute app-data path", got)
		}
	})

	t.Run("legacy relative fallback when no config dir", func(t *testing.T) {
		t.Setenv("MOCKTAIL_DB_PATH", "")
		// os.UserConfigDir() fails when HOME is empty on unix/darwin, forcing the fallback.
		t.Setenv("HOME", "")
		if _, err := os.UserConfigDir(); err == nil {
			t.Skip("UserConfigDir still resolves without HOME on this platform; fallback not reachable")
		}
		want := filepath.Join("db", "apis.db")
		if got := resolveDBPath(); got != want {
			t.Fatalf("resolveDBPath() = %q, want %q", got, want)
		}
	})
}

func TestInitDatabaseCreatesAndMigrates(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "nested", "dir", "apis.db")
	t.Setenv("MOCKTAIL_DB_PATH", dbPath)

	initDatabase()

	if database.DBConn == nil {
		t.Fatal("initDatabase() left database.DBConn nil")
	}
	if _, err := os.Stat(dbPath); err != nil {
		t.Fatalf("expected db file at %q: %v", dbPath, err)
	}
	if !database.DBConn.Migrator().HasTable(&core.Api{}) {
		t.Fatal("initDatabase() did not migrate the Api table")
	}
}

func TestDatabasePersistsAcrossReopen(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "apis.db")
	t.Setenv("MOCKTAIL_DB_PATH", dbPath)

	initDatabase()
	row := &core.Api{
		Endpoint:   "users",
		Method:     "GET",
		Key:        "GETusers",
		StatusCode: 200,
		Response:   []byte(`{"ok":true}`),
	}
	if err := database.DBConn.Create(row).Error; err != nil {
		t.Fatalf("insert row: %v", err)
	}

	// Close the first handle so the file is fully flushed before reopening.
	if sqlDB, err := database.DBConn.DB(); err == nil {
		_ = sqlDB.Close()
	}

	reopened, err := gorm.Open(gormlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		t.Fatalf("reopen db: %v", err)
	}
	var count int64
	if err := reopened.Model(&core.Api{}).Where("key = ?", "GETusers").Count(&count).Error; err != nil {
		t.Fatalf("count after reopen: %v", err)
	}
	if count != 1 {
		t.Fatalf("row count after reopen = %d, want 1 (data did not persist)", count)
	}
}

func TestBindListenerPortResolution(t *testing.T) {
	t.Run("explicit port is honored", func(t *testing.T) {
		port := freePort(t)
		t.Setenv("MOCKTAIL_PORT", strconv.Itoa(port))
		ln, err := bindListener()
		if err != nil {
			t.Fatalf("bindListener() on free port %d: %v", port, err)
		}
		defer ln.Close()
		if got := ln.Addr().(*net.TCPAddr).Port; got != port {
			t.Fatalf("bound port = %d, want %d", got, port)
		}
	})

	t.Run("PORT is used when MOCKTAIL_PORT is unset", func(t *testing.T) {
		port := freePort(t)
		t.Setenv("MOCKTAIL_PORT", "")
		t.Setenv("PORT", strconv.Itoa(port))
		ln, err := bindListener()
		if err != nil {
			t.Fatalf("bindListener() via PORT %d: %v", port, err)
		}
		defer ln.Close()
		if got := ln.Addr().(*net.TCPAddr).Port; got != port {
			t.Fatalf("bound port = %d, want %d", got, port)
		}
	})

	t.Run("explicit busy port errors", func(t *testing.T) {
		busy, err := net.Listen("tcp", ":0")
		if err != nil {
			t.Fatalf("occupy port: %v", err)
		}
		defer busy.Close()
		port := busy.Addr().(*net.TCPAddr).Port
		t.Setenv("MOCKTAIL_PORT", strconv.Itoa(port))
		if ln, err := bindListener(); err == nil {
			ln.Close()
			t.Fatalf("bindListener() on busy port %d: want error, got nil", port)
		}
	})

	t.Run("auto never fails and yields a live port", func(t *testing.T) {
		t.Setenv("MOCKTAIL_PORT", "auto")
		t.Setenv("PORT", "")
		ln, err := bindListener()
		if err != nil {
			t.Fatalf("bindListener(auto): %v", err)
		}
		defer ln.Close()
		if got := ln.Addr().(*net.TCPAddr).Port; got <= 0 {
			t.Fatalf("auto bound port = %d, want > 0", got)
		}
	})

	t.Run("default prefers the signature port when free", func(t *testing.T) {
		t.Setenv("MOCKTAIL_PORT", "")
		t.Setenv("PORT", "")
		ln, err := bindListener()
		if err != nil {
			t.Skipf("signature port %d busy (dev server running?), skipping", autoPortBase)
		}
		defer ln.Close()
		if got := ln.Addr().(*net.TCPAddr).Port; got != autoPortBase {
			t.Fatalf("default bound port = %d, want %d", got, autoPortBase)
		}
	})
}

// TestFullBootSmoke stands up the real Fiber app on a real listener (auto port so it
// never collides with a running dev server) and drives it over HTTP: /health reports
// the bound port, a mock is created via the core API, and the mock serves it back.
func TestFullBootSmoke(t *testing.T) {
	t.Setenv("MOCKTAIL_DB_PATH", filepath.Join(t.TempDir(), "apis.db"))
	t.Setenv("MOCKTAIL_PORT", "auto")
	t.Setenv("PORT", "")
	t.Setenv("MOCKTAIL_API_KEY", "") // mock endpoints open

	initDatabase()

	app := fiber.New()
	setupRoutes(app)

	ln, err := bindListener()
	if err != nil {
		t.Fatalf("bindListener: %v", err)
	}
	boundPort = ln.Addr().(*net.TCPAddr).Port
	base := fmt.Sprintf("http://127.0.0.1:%d", boundPort)

	go func() { _ = app.Listener(ln) }()
	t.Cleanup(func() { _ = app.Shutdown() })
	waitForServer(t, base+"/health")

	// /health reports the port we actually bound.
	t.Run("health reports bound port", func(t *testing.T) {
		resp, err := http.Get(base + "/health")
		if err != nil {
			t.Fatalf("GET /health: %v", err)
		}
		defer resp.Body.Close()
		var health struct {
			Status string `json:"status"`
			Port   int    `json:"port"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
			t.Fatalf("decode /health: %v", err)
		}
		if health.Status != "healthy" {
			t.Fatalf("health status = %q, want healthy", health.Status)
		}
		if health.Port != boundPort {
			t.Fatalf("health port = %d, want %d", health.Port, boundPort)
		}
	})

	// A mock created through the core API is served by the mock handler.
	t.Run("created mock is served end-to-end", func(t *testing.T) {
		mock := core.Api{
			Endpoint:   "greeting",
			Method:     "GET",
			StatusCode: 201,
			Response:   []byte(`{"hello":"world"}`),
		}
		body, _ := json.Marshal(mock)
		resp, err := http.Post(base+"/core/v1/api", "application/json", strings.NewReader(string(body)))
		if err != nil {
			t.Fatalf("POST create mock: %v", err)
		}
		resp.Body.Close()
		if resp.StatusCode != fiber.StatusOK {
			t.Fatalf("create mock status = %d, want 200", resp.StatusCode)
		}

		resp2, err := http.Get(base + "/mocktail/greeting")
		if err != nil {
			t.Fatalf("GET mock: %v", err)
		}
		defer resp2.Body.Close()
		if resp2.StatusCode != 201 {
			t.Fatalf("mock status = %d, want 201", resp2.StatusCode)
		}
		got, _ := io.ReadAll(resp2.Body)
		var payload map[string]string
		if err := json.Unmarshal(got, &payload); err != nil {
			t.Fatalf("decode mock body %q: %v", got, err)
		}
		if payload["hello"] != "world" {
			t.Fatalf("mock body = %q, want hello=world", got)
		}
	})
}

// waitForServer polls url until it answers or the deadline passes.
func waitForServer(t *testing.T, url string) {
	t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		resp, err := http.Get(url)
		if err == nil {
			resp.Body.Close()
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("server at %s did not come up within deadline", url)
}
