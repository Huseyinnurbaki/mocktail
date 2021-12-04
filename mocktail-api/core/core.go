package core

import (
	"mocktail-api/database"

	"github.com/gofiber/fiber/v2"
	"github.com/jinzhu/gorm"
	"gorm.io/datatypes"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

type Api struct {
	gorm.Model
	Endpoint  string
	Method string
	Key string `gorm:"unique;not null";"primaryKey;autoIncrement:false`
	Response datatypes.JSON
	RequestParams datatypes.JSON
}

func Apis(c *fiber.Ctx) error {
	db := database.DBConn
	var apis []Api
	db.Find(&apis)
	return c.JSON(apis)
}

func ApiByKey(c *fiber.Ctx) error {
	key := c.Params("key")
	db := database.DBConn
	var api Api
	db.Find(&api, key)
	return c.JSON(api)
}

func NewApi(c *fiber.Ctx) error {
	db := database.DBConn
	api := new(Api)
	if err := c.BodyParser(api); err != nil {
		return c.Status(503).SendString(err.Error())
	}
	api.Key = api.Method+api.Endpoint
	db.Create(&api)
	return c.JSON(api)
}

func DeleteApiByKey(c *fiber.Ctx) error {
	key := c.Params("key")
	db := database.DBConn

	var api Api
	db.First(&api, key)
	if api.Key == "" {
		return c.Status(500).SendString("No api Found with Key")
	}
	db.Delete(&api)
	return c.SendString("api Successfully deleted")
}