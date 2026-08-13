package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"mocktail-api/ai"
	"mocktail-api/core"
	"mocktail-api/database"
	"mocktail-api/logger"
	"mocktail-api/mocktail"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"github.com/ncruces/go-sqlite3/gormlite"
	"gorm.io/gorm"
)

// API Key middleware
func apiKeyMiddleware(c *fiber.Ctx) error {
	apiKey := os.Getenv("MOCKTAIL_API_KEY")

	// If no API key is configured, allow all requests
	if apiKey == "" {
		return c.Next()
	}

	// Check X-API-Key header
	providedKey := c.Get("X-API-Key")
	if providedKey == "" {
		// Also check query parameter as fallback
		providedKey = c.Query("api_key")
	}

	if providedKey != apiKey {
		logger.Log("⚠️  Unauthorized request to %s (missing or invalid API key)", c.Path())
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid or missing API key",
		})
	}

	return c.Next()
}

// adminKey guards the management API (/core/v1/*). Empty = auth disabled (default).
var adminKey string

// resolveAdminKey mirrors MOCKTAIL_PORT's tri-state:
//   - unset       → auth off (open; default, backward-compatible)
//   - "<value>"   → auth on with that key (containers)
//   - "auto"/"0"  → auth on with a random per-launch key (crypto/rand; desktop/CLI, no storage)
// The generated flag is true only for the auto case, so main() knows to print the ready URL.
func resolveAdminKey() (key string, generated bool) {
	v := os.Getenv("MOCKTAIL_ADMIN_KEY")
	switch {
	case v == "":
		return "", false
	case strings.EqualFold(v, "auto") || v == "0":
		b := make([]byte, 24)
		if _, err := rand.Read(b); err != nil {
			log.Fatalf("failed to generate admin key: %v", err)
		}
		return hex.EncodeToString(b), true
	default:
		return v, false
	}
}

// adminAuthMiddleware gates the core/management API when adminKey is set. Static assets and
// /health stay open (they're registered outside this group) so the app loads and the status
// pill can poll. The dashboard sends the key as X-Admin-Key (or ?admin_key= as a fallback).
func adminAuthMiddleware(c *fiber.Ctx) error {
	if adminKey == "" {
		return c.Next()
	}
	provided := c.Get("X-Admin-Key")
	if provided == "" {
		provided = c.Query("admin_key")
	}
	if provided != adminKey {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or missing admin key"})
	}
	return c.Next()
}

func setupRoutes(app *fiber.App) {
	app.Static("/", "./build")

	// Health check endpoint (no auth)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "mocktail-api",
			"port":    boundPort,
		})
	})

	// Core API - management/dashboard. Gated by MOCKTAIL_ADMIN_KEY when set (off by default).
	coreApi := app.Group("/core/v1", adminAuthMiddleware)
	coreApi.Get("/apis", core.GetApis)
	coreApi.Post("/api", core.CreateApi)
	coreApi.Put("/api/:id", core.UpdateApi)
	coreApi.Post("/import", core.ImportApis)
	coreApi.Post("/preview", core.PreviewApi)
	coreApi.Delete("/api/:id", core.DeleteApiByKey)
	coreApi.Get("/logs", core.GetLogs)
	coreApi.Delete("/logs", core.ClearLogs)

	// AI assistant — provider-backed chat + model listing + key config. Behind the admin gate
	// (real cost); the key is a backend secret and never returned to the frontend.
	coreApi.Get("/ai/config", ai.GetConfig)
	coreApi.Post("/ai/config", ai.PostConfig)
	coreApi.Delete("/ai/config", ai.DeleteConfig)
	coreApi.Get("/ai/providers", ai.GetProviders)
	coreApi.Get("/ai/models", ai.GetModels)
	coreApi.Post("/ai/chat", ai.PostChat)

	// Mock API - Protected with API key
	mocktailApi := app.Group("/mocktail", apiKeyMiddleware)
	mocktailApi.Get("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Post("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Put("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Patch("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Delete("/:endpoint/*", mocktail.MockApiHandler)

}

// resolveDBPath decides where apis.db lives:
//  1. MOCKTAIL_DB_PATH (explicit file path) — used by Docker to point at a mounted volume.
//  2. else the OS per-user app-data dir (e.g. ~/Library/Application Support/mocktail/apis.db) —
//     so the desktop app + brew-installed CLI keep one DB that survives updates and isn't tied
//     to the working directory.
//  3. else the legacy relative ./db/apis.db (fallback when no HOME, e.g. a bare scratch container).
func resolveDBPath() string {
	if p := os.Getenv("MOCKTAIL_DB_PATH"); p != "" {
		return p
	}
	if dir, err := os.UserConfigDir(); err == nil {
		return filepath.Join(dir, "mocktail", "apis.db")
	}
	return filepath.Join("db", "apis.db")
}

func initDatabase() {
	var err error

	dbPath := resolveDBPath()
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		panic("failed to create db directory: " + err.Error())
	}

	database.DBConn, err = gorm.Open(gormlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	logger.Log("Connection Opened to Database (%s)", dbPath)
	database.DBConn.AutoMigrate(&core.Api{})
	logger.Log("Database Migrated")
}

// boundPort is the TCP port the server actually listens on (resolved at startup, reported by /health).
var boundPort int

// autoPortBase is Mocktail's signature default port. Common ports (3000/4000/8080) are often
// already taken on a dev machine, so Mocktail uses a quiet one — 6625 spells "MOCK" on a phone
// keypad (M-O-C-K) and sits well clear of the busy ranges.
const autoPortBase = 6625

// bindListener opens the TCP listener based on MOCKTAIL_PORT (then the platform-standard PORT):
//   - a number → that exact port (fails if busy — an explicit request)
//   - unset    → 6625 (the default; Docker maps 6625:6625)
//   - "auto"/0 → prefer 6625, scan the next 10, else any OS-assigned free port. For the desktop
//     app, which has no terminal to resolve a port clash.
func bindListener() (net.Listener, error) {
	p := os.Getenv("MOCKTAIL_PORT")
	if p == "" {
		p = os.Getenv("PORT")
	}

	switch {
	case p == "":
		return net.Listen("tcp", fmt.Sprintf(":%d", autoPortBase))
	case !strings.EqualFold(p, "auto") && p != "0":
		return net.Listen("tcp", ":"+p)
	}

	// auto: try the quiet range first, then fall back to an OS-assigned free port.
	for i := 0; i < 10; i++ {
		if ln, err := net.Listen("tcp", fmt.Sprintf(":%d", autoPortBase+i)); err == nil {
			return ln, nil
		}
	}
	return net.Listen("tcp", ":0")
}

func main() {
	// Load .env file if it exists (for local development)
	// Silently ignore if file doesn't exist (production uses env vars directly)
	_ = godotenv.Load()

	app := fiber.New()

	// Configure CORS from environment variables
	corsOrigins := os.Getenv("MOCKTAIL_CORS_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "*" // Default: allow all origins
	}

	corsMethods := os.Getenv("MOCKTAIL_CORS_METHODS")
	if corsMethods == "" {
		corsMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS" // Default: all methods
	}

	corsHeaders := os.Getenv("MOCKTAIL_CORS_HEADERS")
	if corsHeaders == "" {
		corsHeaders = "*" // Default: allow all headers
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     corsMethods,
		AllowHeaders:     corsHeaders,
		AllowCredentials: strings.ToLower(os.Getenv("MOCKTAIL_CORS_CREDENTIALS")) == "true",
	}))

	// Request logging middleware
	app.Use(func(c *fiber.Ctx) error {
		// Skip logging for static files, health check, logs endpoint, and catalog polling
		path := c.Path()
		if path == "/health" || path == "/" || strings.HasPrefix(path, "/static") ||
		   strings.HasPrefix(path, "/core/v1/logs") || path == "/core/v1/apis" ||
		   strings.HasPrefix(path, "/core/v1/ai") {
			return c.Next()
		}

		// Process request
		start := time.Now()
		err := c.Next()

		// Log request/response with structured data
		duration := time.Since(start)
		status := c.Response().StatusCode()
		responseBody := ""

		// Skip response body for /core/v1/apis (too large)
		if path != "/core/v1/apis" {
			responseBody = string(c.Response().Body())
		}

		// Create string copies to prevent Fiber buffer reuse
		method := string([]byte(c.Method()))
		pathCopy := string([]byte(path))

		// Capture the response headers actually served (custom Content-Type, X-*, etc.).
		respHeaders := map[string]string{}
		c.Response().Header.VisitAll(func(k, v []byte) {
			respHeaders[string(k)] = string(v)
		})

		logger.LogRequest(
			method,
			pathCopy,
			status,
			duration.Round(time.Millisecond).String(),
			responseBody,
			respHeaders,
		)

		return err
	})

	// Log configuration on startup
	logger.Log("=== Mocktail Configuration ===")
	logger.Log("CORS Origins: %s", corsOrigins)
	logger.Log("CORS Methods: %s", corsMethods)
	logger.Log("CORS Headers: %s", corsHeaders)
	logger.Log("CORS Credentials: %t", strings.ToLower(os.Getenv("MOCKTAIL_CORS_CREDENTIALS")) == "true")

	apiKey := os.Getenv("MOCKTAIL_API_KEY")
	if apiKey != "" {
		logger.Log("API Key: *** (set, %d characters)", len(apiKey))
	} else {
		logger.Log("API Key: (not set - mock endpoints are open)")
	}

	// Resolve the management API (admin) key. Off by default; on when MOCKTAIL_ADMIN_KEY is set.
	var adminGenerated bool
	adminKey, adminGenerated = resolveAdminKey()
	switch {
	case adminKey == "":
		logger.Log("Admin Key: (not set - core API is open)")
	case adminGenerated:
		logger.Log("Admin Key: *** (auto-generated this launch)")
	default:
		logger.Log("Admin Key: *** (set via MOCKTAIL_ADMIN_KEY)")
	}
	logger.Log("==============================")

	initDatabase()

	setupRoutes(app)

	ln, err := bindListener()
	if err != nil {
		log.Fatalf("Failed to bind a port: %v", err)
	}
	boundPort = ln.Addr().(*net.TCPAddr).Port
	logger.Log("Mocktail listening on http://localhost:%d", boundPort)
	// For the auto-generated key there's no terminal handshake, so print a ready-to-use URL.
	// The token rides the URL fragment (#) — never sent to the server or written to logs by browsers.
	if adminGenerated {
		logger.Log("Open the dashboard: http://localhost:%d/#admin_key=%s", boundPort, adminKey)
	}
	log.Fatal(app.Listener(ln))
}
