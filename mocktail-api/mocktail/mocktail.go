package mocktail

import (
	"encoding/json"
	"mocktail-api/database"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/datatypes"
)

type Api struct {
	ID         uint           `gorm:"primary_key;auto_increment;not_null"`
	Endpoint   string         `validate:"required"`
	Method     string         `validate:"is-method-allowed"`
	Key        string         `gorm:"unique;not null"`
	StatusCode int            `gorm:"default:200" json:"StatusCode"`
	Delay      int            `gorm:"default:0" json:"Delay"`
	Response   datatypes.JSON `validate:"required"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}

func MockApiHandler(c *fiber.Ctx) error {
	key := strings.Replace(string(c.Request().URI().PathOriginal()), "/mocktail/", c.Method(), 1)
	db := database.DBConn
	var api Api
	db.Where("key = ?", key).First(&api)
	if api.Key == "" {
		return c.Status(404).JSON(ErrorResponse{Message: "Api not found..."})
	}

	// Apply delay if set
	if api.Delay > 0 {
		time.Sleep(time.Duration(api.Delay) * time.Millisecond)
	}

	// Set default status code if not set
	statusCode := api.StatusCode
	if statusCode == 0 {
		statusCode = 200
	}

	// Handle special status codes that should return no content
	if statusCode == 204 || statusCode == 304 {
		return c.SendStatus(statusCode)
	}

	// Unmarshal the JSON response
	var response interface{}
	if err := json.Unmarshal(api.Response, &response); err != nil {
		return c.Status(500).JSON(ErrorResponse{Message: "Invalid response data"})
	}

	return c.Status(statusCode).JSON(response)
}
