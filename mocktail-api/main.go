package main

import (
	"mocktail-api/core"
	"mocktail-api/mocktail"
	"mocktail-api/database"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

func setupRoutes(app *fiber.App) {
	coreApi := app.Group("/core/v1")
	coreApi.Post("/api", core.NewApi)
	coreApi.Delete("/api/:id", core.DeleteApiByKey)
	coreApi.Get("/apis", core.Apis)

	moctailApi := app.Group("/mocktail")
	moctailApi.Get("/:endpoint", mocktail.GetHandler)
	moctailApi.Post("/:endpoint", mocktail.PostHandler)

}

func initDatabase() {
	var err error
	database.DBConn, err = gorm.Open("sqlite3", "apis.db")
	if err != nil {
		panic("failed to connect database")
	}
	fmt.Println("Connection Opened to Database")
	database.DBConn.AutoMigrate(&core.Api{})
	fmt.Println("Database Migrated")
}

func main() {
	app := fiber.New()
	app.Use(cors.New())

	initDatabase()
	defer database.DBConn.Close()

	setupRoutes(app)

	log.Fatal(app.Listen(":3200"))
}