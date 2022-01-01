package core

import (
	"mocktail-api/database"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gorm.io/datatypes"
)

type Api struct {
	Endpoint string `validate:"required"`
	Method string `validate:"is-method-allowed"`
	Key string `gorm:"unique;not null";"primaryKey;autoIncrement:false"`
	Response datatypes.JSON `validate:"required"`
}
type Apis struct {
	Apis []Api `validate:"required"`
}

func GetApis(c *fiber.Ctx) error {
	db := database.DBConn
	var apis []Api
	db.Find(&apis)
	return c.JSON(apis)
}

func CreateApi(c *fiber.Ctx) error {
	api := new(Api)
	if err := c.BodyParser(api); err != nil {
		return c.Status(503).JSON(fiber.Map{"message":err.Error()})
	}
	if err := InsertApi(api); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(api)
}

func InsertApi(api *Api) error{
	db := database.DBConn
	api.Key = api.Method+api.Endpoint
	validate := validator.New()
	validate.RegisterValidation("is-method-allowed", validateNewApiHTTPMethod)
	if err := validate.Struct(api); err != nil {
		return err
	}
	if err := db.Create(&api).Error; err != nil {
		return err
	}
	
	return nil
}

func DeleteApiByKey(c *fiber.Ctx) error {
	key := c.Params("key")
	db := database.DBConn

	var api Api
	if err := db.Unscoped().Delete(&api, "Key = ? ", key).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"message":err.Error()})
	}
	
	return c.Status(200).JSON(fiber.Map{"message":"Successfully Deleted"})
}

func ExportApis(c *fiber.Ctx) error {
	db := database.DBConn
	var apis []Api
	db.Find(&apis)
	return c.JSON(apis)
}
func ImportApis(c *fiber.Ctx) error {

	apis := new(Apis)

	if err := c.BodyParser(apis); err != nil {
		return c.Status(400).JSON(fiber.Map{"message":err.Error()})
	}

	for i := 0; i < len(apis.Apis); i++ {
		InsertApi(&apis.Apis[i])
    }
	return c.Status(200).JSON(fiber.Map{"message":`Completed.`})
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