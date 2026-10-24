package core

import (
	"mocktail-api/logger"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// defaultLogsLimit caps how many summaries one poll returns (the dashboard keeps about as many).
const defaultLogsLimit = 1000

// GetLogs returns summaries (no bodies/headers) of entries newer than ?after=<id>, oldest first,
// capped to the newest ?limit= (legacy alias: ?lines=). Fetch a full entry with GetLog.
// epoch changes when the server restarts (IDs restart too); firstId is the oldest ID still held,
// so clients can drop what the server has evicted or cleared.
func GetLogs(c *fiber.Ctx) error {
	after, err := strconv.ParseUint(c.Query("after", "0"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "after must be a non-negative integer"})
	}
	limit, err := strconv.Atoi(c.Query("limit", c.Query("lines", strconv.Itoa(defaultLogsLimit))))
	if err != nil || limit <= 0 {
		limit = defaultLogsLimit
	}

	logBuffer := logger.GetGlobalBuffer()
	logs := logBuffer.Since(after, limit)

	return c.JSON(fiber.Map{
		"logs":    logs,
		"count":   len(logs),
		"epoch":   logger.Epoch,
		"firstId": logBuffer.FirstID(),
	})
}

// GetLog returns one full log entry — body and headers included — by ID.
func GetLog(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid log id"})
	}
	entry, ok := logger.GetGlobalBuffer().Get(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "log entry not found (it may have been evicted)"})
	}
	return c.JSON(entry)
}

// ClearLogs clears the log buffer
func ClearLogs(c *fiber.Ctx) error {
	logBuffer := logger.GetGlobalBuffer()
	logBuffer.Clear()

	return c.JSON(fiber.Map{
		"message": "Logs cleared successfully",
	})
}
