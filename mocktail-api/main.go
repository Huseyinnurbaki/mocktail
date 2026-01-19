package main

import (
	"fmt"
	"log"
	"mocktail-api/core"
	"mocktail-api/database"
	"mocktail-api/mocktail"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupRoutes(app *fiber.App) {
	app.Static("/", "./build")

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "healthy",
			"service": "mocktail-api",
		})
	})

	coreApi := app.Group("/core/v1")
	coreApi.Get("/apis", core.GetApis)
	coreApi.Post("/api", core.CreateApi)
	coreApi.Put("/api/:id", core.UpdateApi)
	coreApi.Post("/import", core.ImportApis)
	coreApi.Delete("/api/:id", core.DeleteApiByKey)

	mocktailApi := app.Group("/mocktail")
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
	// addr := `:` + os.Getenv("PORT")
	app := fiber.New()
	app.Use(cors.New())

	initDatabase()

	setupRoutes(app)

	log.Fatal(app.Listen(":4000"))
}
