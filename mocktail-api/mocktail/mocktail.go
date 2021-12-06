package mocktail

import (
	"mocktail-api/database"

	"github.com/gofiber/fiber/v2"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gorm.io/datatypes"
)

type Api struct {
	gorm.Model
	Endpoint  string
	Method string
	Key string `gorm:"unique;not null";"primaryKey;autoIncrement:false`
	Response datatypes.JSON
	RequestParams datatypes.JSON
}

func GetHandler(c *fiber.Ctx) error {
	key := "GET"+c.Params("endpoint")
	db := database.DBConn
	var api Api
	db.Where("key = ?", key).First(&api)
	return c.JSON(api.Response)
}
func PostHandler(c *fiber.Ctx) error {
	// TODO: validate req params ??
	key := "POST"+c.Params("endpoint")
	db := database.DBConn
	var api Api
	db.Where("key = ?", key).First(&api)
	return c.JSON(api.Response)
}
