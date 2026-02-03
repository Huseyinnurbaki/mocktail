package main

import (
	"fmt"
	"log"
	"mocktail-api/core"
	"mocktail-api/database"
	"mocktail-api/mocktail"
	"os"
	"strings"

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
	fmt.Println("Connection Opened to Database")
	database.DBConn.AutoMigrate(&core.Api{})
	fmt.Println("Database Migrated")
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

	// Log configuration on startup
	fmt.Println("=== Mocktail Configuration ===")
	fmt.Printf("CORS Origins: %s\n", corsOrigins)
	fmt.Printf("CORS Methods: %s\n", corsMethods)
	fmt.Printf("CORS Headers: %s\n", corsHeaders)
	fmt.Printf("CORS Credentials: %t\n", strings.ToLower(os.Getenv("MOCKTAIL_CORS_CREDENTIALS")) == "true")

	apiKey := os.Getenv("MOCKTAIL_API_KEY")
	if apiKey != "" {
		fmt.Printf("API Key: *** (set, %d characters)\n", len(apiKey))
	} else {
		fmt.Println("API Key: (not set - mock endpoints are open)")
	}
	fmt.Println("==============================")

	initDatabase()

	setupRoutes(app)

	log.Fatal(app.Listen(":4000"))
}
