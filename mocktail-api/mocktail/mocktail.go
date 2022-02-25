package mocktail

import (
	"mocktail-api/database"
	"strings"

	"github.com/gofiber/fiber/v2"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gorm.io/datatypes"
)

type Api struct {
	ID       uint           `gorm:"primary_key;auto_increment;not_null"`
	Endpoint string         `validate:"required"`
	Method   string         `validate:"is-method-allowed"`
	Key      string         `gorm:"unique;not null"`
	Response datatypes.JSON `validate:"required"`
}

func MockApiHandler(c *fiber.Ctx) error {
	key := strings.Replace(string(c.Request().URI().PathOriginal()), "/mocktail/", c.Method(), 1)
	db := database.DBConn
	var api Api
	db.Where("key = ?", key).First(&api)
	if api.Key == "" {
		return c.Status(404).JSON(fiber.Map{"message": "Api not found..."})
	}
	return c.JSON(api.Response)
}
