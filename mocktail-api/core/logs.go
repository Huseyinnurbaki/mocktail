package core

import (
	"mocktail-api/logger"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// GetLogs returns recent log entries
func GetLogs(c *fiber.Ctx) error {
	// Get optional 'lines' query parameter
	linesParam := c.Query("lines", "500")
	lines, err := strconv.Atoi(linesParam)
	if err != nil || lines <= 0 {
		lines = 500
	}

	logBuffer := logger.GetGlobalBuffer()
	logs := logBuffer.GetLast(lines)

	return c.JSON(fiber.Map{
		"logs":  logs,
		"count": len(logs),
	})
}

// ClearLogs clears the log buffer
func ClearLogs(c *fiber.Ctx) error {
	logBuffer := logger.GetGlobalBuffer()
	logBuffer.Clear()

	return c.JSON(fiber.Map{
		"message": "Logs cleared successfully",
	})
}
