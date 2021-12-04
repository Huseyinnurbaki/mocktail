package main

import (
	"mocktail-api/core"
	"mocktail-api/database"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

func setupRoutes(app *fiber.App) {
	// app.Get("/api/v1/book", book.GetBooks)
	// app.Get("/api/v1/book/:id", book.GetBook)
	// app.Post("/api/v1/book", book.NewBook)
	// app.Delete("/api/v1/book/:id", book.DeleteBook)
	
	app.Post("/api/v1/api", core.NewApi)
	app.Get("/api/v1/apis", core.Apis)

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