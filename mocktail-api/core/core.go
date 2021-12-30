package core

import (
	"mocktail-api/database"
	
	"github.com/gofiber/fiber/v2"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gorm.io/datatypes"
	"github.com/go-playground/validator/v10"
)

type Api struct {
	Endpoint string `validate:"required"`
	Method string `validate:"is-method-allowed"`
	Key string `gorm:"unique;not null";"primaryKey;autoIncrement:false"`
	Response datatypes.JSON `validate:"required"`
}

func Apis(c *fiber.Ctx) error {
	db := database.DBConn
	var apis []Api
	db.Find(&apis)
	return c.JSON(apis)
}

func NewApi(c *fiber.Ctx) error {
	db := database.DBConn
	api := new(Api)
	validate := validator.New()
	validate.RegisterValidation("is-method-allowed", validateNewApiHTTPMethod)
	if err := c.BodyParser(api); err != nil {
		return c.Status(503).JSON(fiber.Map{"message":err.Error()})
	}
	api.Key = api.Method+api.Endpoint
	if err := validate.Struct(api); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": err.Error()})
	}
	db.Create(&api)
	return c.JSON(api)
}

func DeleteApiByKey(c *fiber.Ctx) error {
	key := c.Params("id")
	db := database.DBConn

	var api Api
	db.First(&api, key)
	if api.Key == "" {
		return c.Status(400).JSON(fiber.Map{"message":"Bad Request"})
	}
	db.Unscoped().Delete(&api)
	return c.JSON(api)
}

func Export(c *fiber.Ctx) error {
	db := database.DBConn
	var apis []Api
	db.Find(&apis)
	return c.JSON(apis)
}


func validateNewApiHTTPMethod(fl validator.FieldLevel) bool {
	HTTPMethodList := [5]string{"GET", "POST", "PUT", "PATCH", "DELETE"}
    for _, b := range HTTPMethodList {
        if b == fl.Field().String() {
            return true
        }
    }
    return false	
}