package mocktail

import (
	"encoding/json"
	"mocktail-api/database"
	"mocktail-api/randomize"
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
	Randomize  datatypes.JSON `json:"Randomize"` // optional per-field faker config; nil = serve Response as-is
	Headers    datatypes.JSON `json:"Headers"`   // optional response headers {"Header-Name":"value"}; nil = none
}

type ErrorResponse struct {
	Message string `json:"message"`
}

func MockApiHandler(c *fiber.Ctx) error {
	path := strings.TrimLeft(strings.TrimPrefix(string(c.Request().URI().PathOriginal()), "/mocktail"), "/")
	key := c.Method() + path
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

	// Apply custom response headers, if any. A user-supplied Content-Type must win over the
	// default application/json, so remember it and bypass c.JSON() below (which would overwrite it).
	customContentType := ""
	if len(api.Headers) > 0 {
		var headers map[string]string
		if err := json.Unmarshal(api.Headers, &headers); err == nil {
			for k, v := range headers {
				c.Set(k, v)
				if strings.EqualFold(k, "Content-Type") {
					customContentType = v
				}
			}
		}
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

	// Apply per-field randomization on each request when configured.
	if len(api.Randomize) > 0 {
		var cfg randomize.Config
		if err := json.Unmarshal(api.Randomize, &cfg); err == nil && len(cfg) > 0 {
			response = randomize.Apply(response, cfg)
		}
	}

	// If the user set a custom Content-Type, marshal ourselves and Send so Fiber's .JSON()
	// doesn't force application/json.
	if customContentType != "" {
		body, err := json.Marshal(response)
		if err != nil {
			return c.Status(500).JSON(ErrorResponse{Message: "Invalid response data"})
		}
		return c.Status(statusCode).Send(body)
	}

	return c.Status(statusCode).JSON(response)
}
