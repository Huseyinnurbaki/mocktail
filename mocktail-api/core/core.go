package core

import (
	"mocktail-api/database"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"gorm.io/datatypes"
)

type Api struct {
	ID       uint            `gorm:"primary_key;auto_increment;not_null"`
	Endpoint string          `validate:"required"`
	Method   string          `validate:"is-method-allowed"`
	Key      string          `gorm:"unique;not null"`
	Response datatypes.JSON  `validate:"required"`
}

type Apis struct {
	Apis []Api `validate:"required"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}

type SuccessResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

type ImportResult struct {
	Status   int    `json:"status"`
	Message  string `json:"message"`
	Imported int    `json:"imported"`
	Skipped  int    `json:"skipped"`
	Failed   int    `json:"failed"`
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
		return c.Status(503).JSON(ErrorResponse{Message: err.Error()})
	}
	if err := InsertApi(api); err != nil {
		return c.Status(400).JSON(ErrorResponse{Message: err.Error()})
	}
	return c.JSON(api)
}

func InsertApi(api *Api) error {
	db := database.DBConn
	api.Key = api.Method + api.Endpoint
	validate := validator.New()
	validate.RegisterValidation("is-method-allowed", isApiHTTPMethodValid)
	if err := validate.Struct(api); err != nil {
		return err
	}
	if err := db.Create(&api).Error; err != nil {
		return err
	}

	return nil
}

func DeleteApiByKey(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DBConn

	if err := db.Unscoped().Where("ID = ?", id).Delete(&Api{}).Error; err != nil {
		return c.Status(400).JSON(ErrorResponse{Message: err.Error()})
	}

	return c.JSON(SuccessResponse{Status: 200, Message: "Completed"})
}

func ImportApis(c *fiber.Ctx) error {
	db := database.DBConn
	apis := new(Apis)

	if err := c.BodyParser(apis); err != nil {
		return c.Status(400).JSON(ErrorResponse{Message: err.Error()})
	}

	imported := 0
	skipped := 0
	failed := 0

	for i := 0; i < len(apis.Apis); i++ {
		importedApi := apis.Apis[i]
		key := importedApi.Method + importedApi.Endpoint

		// Check if already exists
		var existing Api
		if err := db.Where("key = ?", key).First(&existing).Error; err == nil {
			skipped++
			continue
		}

		// Create new API without ID
		newApi := Api{
			Endpoint: importedApi.Endpoint,
			Method:   importedApi.Method,
			Response: importedApi.Response,
		}

		// Try to insert
		if err := InsertApi(&newApi); err != nil {
			failed++
		} else {
			imported++
		}
	}

	result := ImportResult{
		Status:   200,
		Message:  "Completed",
		Imported: imported,
		Skipped:  skipped,
		Failed:   failed,
	}

	return c.JSON(result)
}


func isApiHTTPMethodValid(fl validator.FieldLevel) bool {
	HTTPMethodList := [5]string{"GET", "POST", "PUT", "PATCH", "DELETE"}
	for _, b := range HTTPMethodList {
		if b == fl.Field().String() {
			return true
		}
	}
	return false
}
