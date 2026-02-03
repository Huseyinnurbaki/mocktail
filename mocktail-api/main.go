package main

import (
	"log"
	"mocktail-api/core"
	"mocktail-api/database"
	"mocktail-api/logger"
	"mocktail-api/mocktail"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"gorm.io/driver/sqlite"
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

func setupRoutes(app *fiber.App) {
	app.Static("/", "./build")

	// Health check endpoint (no auth)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "healthy",
			"service": "mocktail-api",
		})
	})

	// Core API - No auth required (dashboard uses this)
	coreApi := app.Group("/core/v1")
	coreApi.Get("/apis", core.GetApis)
	coreApi.Post("/api", core.CreateApi)
	coreApi.Put("/api/:id", core.UpdateApi)
	coreApi.Post("/import", core.ImportApis)
	coreApi.Delete("/api/:id", core.DeleteApiByKey)
	coreApi.Get("/logs", core.GetLogs)
	coreApi.Delete("/logs", core.ClearLogs)

	// Mock API - Protected with API key
	mocktailApi := app.Group("/mocktail", apiKeyMiddleware)
	mocktailApi.Get("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Post("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Put("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Patch("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Delete("/:endpoint/*", mocktail.MockApiHandler)

}

func initDatabase() {
	var err error

	// Create db directory if it doesn't exist
	if err := os.MkdirAll("db", 0755); err != nil {
		panic("failed to create db directory")
	}

	database.DBConn, err = gorm.Open(sqlite.Open("db/apis.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	logger.Log("Connection Opened to Database")
	database.DBConn.AutoMigrate(&core.Api{})
	logger.Log("Database Migrated")
}

// TODO: read addr from env
func main() {
	// Load .env file if it exists (for local development)
	// Silently ignore if file doesn't exist (production uses env vars directly)
	_ = godotenv.Load()

	// addr := `:` + os.Getenv("PORT")
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
		   strings.HasPrefix(path, "/core/v1/logs") || path == "/core/v1/apis" {
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

		logger.LogRequest(
			c.Method(),
			path,
			status,
			duration.Round(time.Millisecond).String(),
			responseBody,
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
	logger.Log("==============================")

	initDatabase()

	setupRoutes(app)

	log.Fatal(app.Listen(":4000"))
}
