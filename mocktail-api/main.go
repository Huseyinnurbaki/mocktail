package main

import (
	"fmt"
	"flag"
	"log"
	"mocktail-api/core"
	"mocktail-api/database"
	"mocktail-api/mocktail"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

func setupRoutes(app *fiber.App) {
	app.Static("/", "./build")
	coreApi := app.Group("/core/v1")
	coreApi.Get("/apis", core.GetApis)
	coreApi.Get("/export", core.ExportApis)
	coreApi.Post("/api", core.CreateApi)
	coreApi.Post("/import", core.ImportApis)
	coreApi.Delete("/api/:id", core.DeleteApiByKey)

	mocktailApi := app.Group("/mocktail")
	mocktailApi.Get("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Post("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Put("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Patch("/:endpoint/*", mocktail.MockApiHandler)
	mocktailApi.Delete("/:endpoint/*", mocktail.MockApiHandler)

}

func initDatabase(dbName string) {
	var err error
	database.DBConn, err = gorm.Open("sqlite3", dbName)
	if err != nil {
		panic("failed to connect database")
	}
	fmt.Println("Connection Opened to Database")
	database.DBConn.AutoMigrate(&core.Api{})
	fmt.Println("Database Migrated")
}
// TODO: read addr from env
func main() {
	dbNameFlag := flag.String("dbname", "apis.db", "db name: default apis.db")
	portFlag := flag.Uint("port", 4000, "listen port. default: 4000")

	flag.Parse()

	app := fiber.New()
	app.Use(cors.New())

	initDatabase(*dbNameFlag)
	defer database.DBConn.Close()

	setupRoutes(app)

	port := fmt.Sprintf(":%v", *portFlag)
	log.Fatal(app.Listen(port))
}
