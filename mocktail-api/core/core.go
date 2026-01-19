package core

import (
	"mocktail-api/database"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"gorm.io/datatypes"
)

type Api struct {
	ID         uint            `gorm:"primary_key;auto_increment;not_null"`
	Endpoint   string          `validate:"required"`
	Method     string          `validate:"is-method-allowed"`
	Key        string          `gorm:"unique;not null"`
	StatusCode int             `gorm:"default:200" json:"StatusCode"`
	Delay      int             `gorm:"default:0" json:"Delay"`
	Response   datatypes.JSON  `validate:"required"`
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

	// Set defaults if not provided
	if api.StatusCode == 0 {
		api.StatusCode = 200
	}

	// Cap delay at 30 seconds (30000ms)
	if api.Delay > 30000 {
		api.Delay = 30000
	}
	if api.Delay < 0 {
		api.Delay = 0
	}

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

func UpdateApi(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DBConn

	var existingApi Api
	if err := db.Where("ID = ?", id).First(&existingApi).Error; err != nil {
		return c.Status(404).JSON(ErrorResponse{Message: "API not found"})
	}

	updatedApi := new(Api)
	if err := c.BodyParser(updatedApi); err != nil {
		return c.Status(400).JSON(ErrorResponse{Message: err.Error()})
	}

	// Update fields
	existingApi.Endpoint = updatedApi.Endpoint
	existingApi.Method = updatedApi.Method
	existingApi.StatusCode = updatedApi.StatusCode
	existingApi.Delay = updatedApi.Delay
	existingApi.Response = updatedApi.Response
	existingApi.Key = updatedApi.Method + updatedApi.Endpoint

	// Set defaults if not provided
	if existingApi.StatusCode == 0 {
		existingApi.StatusCode = 200
	}

	// Cap delay at 30 seconds (30000ms)
	if existingApi.Delay > 30000 {
		existingApi.Delay = 30000
	}
	if existingApi.Delay < 0 {
		existingApi.Delay = 0
	}

	// Validate
	validate := validator.New()
	validate.RegisterValidation("is-method-allowed", isApiHTTPMethodValid)
	if err := validate.Struct(&existingApi); err != nil {
		return c.Status(400).JSON(ErrorResponse{Message: err.Error()})
	}

	// Save
	if err := db.Save(&existingApi).Error; err != nil {
		return c.Status(400).JSON(ErrorResponse{Message: err.Error()})
	}

	return c.JSON(existingApi)
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
		delay := importedApi.Delay
		if delay > 30000 {
			delay = 30000
		}
		if delay < 0 {
			delay = 0
		}

		statusCode := importedApi.StatusCode
		if statusCode == 0 {
			statusCode = 200
		}

		newApi := Api{
			Endpoint:   importedApi.Endpoint,
			Method:     importedApi.Method,
			StatusCode: statusCode,
			Delay:      delay,
			Response:   importedApi.Response,
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
