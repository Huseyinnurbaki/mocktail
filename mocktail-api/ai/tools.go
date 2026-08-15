package ai

import (
	"encoding/json"
	"fmt"
	"strings"

	"mocktail-api/core"
	"mocktail-api/database"

	"gorm.io/datatypes"
)

// The assistant's toolset mirrors the MCP server (list/create/update/delete) so the in-app
// assistant is as capable as external Claude — it just runs the tools in-process against the
// same DB instead of over HTTP.

// generatorTypes are the per-field random generators Mocktail supports (see randomize.Generate).
var generatorTypes = []any{
	"uuid", "firstName", "lastName", "fullName", "name", "email", "phone", "username", "url",
	"domain", "ipv4", "number", "float", "price", "bool", "word", "sentence", "paragraph",
	"pastDate", "futureDate", "city", "country", "countryCode", "hexColor", "fixed",
}

// randomizeSchema describes the optional per-field randomization map on create/update.
func randomizeSchema() map[string]any {
	return map[string]any{
		"type": "object",
		"description": "Optional per-field random generators. Maps a dot-path in the response (e.g. " +
			"\"id\" or \"users.email\") to a generator. Values regenerate on every request. Do NOT put " +
			"{{...}} placeholders in the response body — use this map instead.",
		"additionalProperties": map[string]any{
			"type": "object",
			"properties": map[string]any{
				"type":  map[string]any{"type": "string", "enum": generatorTypes},
				"min":   map[string]any{"type": "number", "description": "for number/float/price"},
				"max":   map[string]any{"type": "number", "description": "for number/float/price"},
				"value": map[string]any{"description": "literal value when type is 'fixed'"},
			},
			"required": []any{"type"},
		},
	}
}

// headersSchema describes the optional custom response headers on create/update.
func headersSchema() map[string]any {
	return map[string]any{
		"type": "object",
		"description": "Optional custom response headers as a name→value map (e.g. " +
			"{\"X-Mock-Source\":\"Mocktail\"}). May include a Content-Type override.",
		"additionalProperties": map[string]any{"type": "string"},
	}
}

func mockTools() []ToolSpec {
	methodEnum := []any{"GET", "POST", "PUT", "PATCH", "DELETE"}
	return []ToolSpec{
		{
			Name:        "list_mocks",
			Description: "List all configured mock endpoints (id, method, path, status). Use to discover what exists; it does not include response bodies.",
			InputSchema: map[string]any{"type": "object", "properties": map[string]any{}},
		},
		{
			Name:        "get_mock",
			Description: "Read one mock's full definition — response body, status, headers, randomize — by id (from list_mocks) or by path. Use when the user asks what an endpoint returns or how it's configured.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":   map[string]any{"type": "integer", "description": "mock id from list_mocks"},
					"path": map[string]any{"type": "string", "description": "path like /api/users (matches any method on that path)"},
				},
			},
		},
		{
			Name:        "create_mock",
			Description: "Create a new mock endpoint. The path is relative and served at /mocktail/<path>.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"method":     map[string]any{"type": "string", "enum": methodEnum},
					"endpoint":   map[string]any{"type": "string", "description": "path starting with /, e.g. /api/users"},
					"response":   map[string]any{"type": "string", "description": "response body as a JSON string, e.g. {\"id\":\"\",\"email\":\"\"}"},
					"statusCode": map[string]any{"type": "integer", "description": "HTTP status, default 200"},
					"delay":      map[string]any{"type": "integer", "description": "delay in ms, 0–30000 (max 30s), default 0"},
					"randomize":  randomizeSchema(),
					"headers":    headersSchema(),
				},
				"required": []any{"method", "endpoint", "response"},
			},
		},
		{
			Name:        "update_mock",
			Description: "Replace an existing mock by id. All fields are required (the mock is fully replaced).",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":         map[string]any{"type": "integer", "description": "mock id (from list_mocks)"},
					"method":     map[string]any{"type": "string", "enum": methodEnum},
					"endpoint":   map[string]any{"type": "string", "description": "path starting with /"},
					"response":   map[string]any{"type": "string", "description": "response body as a JSON string"},
					"statusCode": map[string]any{"type": "integer"},
					"delay":      map[string]any{"type": "integer", "description": "delay in ms, 0–30000 (max 30s)"},
					"randomize":  randomizeSchema(),
					"headers":    headersSchema(),
				},
				"required": []any{"id", "method", "endpoint", "response"},
			},
		},
		{
			Name:        "delete_mock",
			Description: "Delete a mock endpoint by id. Destructive — confirm with the user first.",
			InputSchema: map[string]any{
				"type":       "object",
				"properties": map[string]any{"id": map[string]any{"type": "integer"}},
				"required":   []any{"id"},
			},
		},
	}
}

// maxDelayMs mirrors the core cap on response delay (see core.InsertApi). The tools reject an
// out-of-range delay (rather than silently clamping) so the assistant can tell the user the limit.
const maxDelayMs = 30000

func validMethod(m string) bool {
	switch strings.ToUpper(m) {
	case "GET", "POST", "PUT", "PATCH", "DELETE":
		return true
	}
	return false
}

// validateMock guards every write the assistant can make (create + update) so a bad/hostile
// tool call is rejected with a clear message rather than persisting a broken mock. update_mock
// writes to the DB directly (not via core.InsertApi), so without this it would skip validation.
func validateMock(method, endpoint string, delay int) (string, bool) {
	if !validMethod(method) {
		return "method must be one of GET, POST, PUT, PATCH, DELETE", true
	}
	if strings.TrimLeft(endpoint, "/") == "" {
		return "endpoint is required (e.g. /api/users)", true
	}
	if delay < 0 || delay > maxDelayMs {
		return fmt.Sprintf("delay must be between 0 and %d ms (max 30s)", maxDelayMs), true
	}
	return "", false
}

// toolNote is a short human-readable summary of a tool call, shown in the chat as it runs.
func toolNote(name string, input json.RawMessage) string {
	var a struct {
		ID       int    `json:"id"`
		Method   string `json:"method"`
		Endpoint string `json:"endpoint"`
		Path     string `json:"path"`
	}
	_ = json.Unmarshal(input, &a)
	switch name {
	case "list_mocks":
		return "Listing mocks"
	case "get_mock":
		if a.ID != 0 {
			return fmt.Sprintf("Reading #%d", a.ID)
		}
		return "Reading " + withSlash(a.Path)
	case "create_mock":
		return fmt.Sprintf("Creating %s %s", a.Method, withSlash(a.Endpoint))
	case "update_mock":
		return fmt.Sprintf("Updating #%d %s %s", a.ID, a.Method, withSlash(a.Endpoint))
	case "delete_mock":
		return fmt.Sprintf("Deleting #%d", a.ID)
	default:
		return name
	}
}

// executeMockTool runs a tool in-process against the DB and returns a result string + error flag.
func executeMockTool(name string, input json.RawMessage) (string, bool) {
	if database.DBConn == nil {
		return "database unavailable", true
	}
	switch name {
	case "list_mocks":
		return listMocks()
	case "get_mock":
		return getMock(input)
	case "create_mock":
		return createMock(input)
	case "update_mock":
		return updateMock(input)
	case "delete_mock":
		return deleteMock(input)
	default:
		return "unknown tool: " + name, true
	}
}

func listMocks() (string, bool) {
	var apis []core.Api
	if err := database.DBConn.Find(&apis).Error; err != nil {
		return err.Error(), true
	}
	type row struct {
		ID     uint   `json:"id"`
		Method string `json:"method"`
		Path   string `json:"path"`
		Status int    `json:"status"`
	}
	out := make([]row, 0, len(apis))
	for _, a := range apis {
		out = append(out, row{ID: a.ID, Method: a.Method, Path: withSlash(a.Endpoint), Status: a.StatusCode})
	}
	b, _ := json.Marshal(out)
	return string(b), false
}

func getMock(input json.RawMessage) (string, bool) {
	var args struct {
		ID   uint   `json:"id"`
		Path string `json:"path"`
	}
	if err := json.Unmarshal(input, &args); err != nil {
		return "invalid arguments: " + err.Error(), true
	}
	var apis []core.Api
	switch {
	case args.ID != 0:
		database.DBConn.Where("id = ?", args.ID).Find(&apis)
	case args.Path != "":
		database.DBConn.Where("endpoint = ?", strings.TrimLeft(args.Path, "/")).Find(&apis)
	default:
		return "provide an id or path", true
	}
	if len(apis) == 0 {
		return "no matching mock", true
	}
	type detail struct {
		ID        uint            `json:"id"`
		Method    string          `json:"method"`
		Path      string          `json:"path"`
		Status    int             `json:"status"`
		Delay     int             `json:"delay,omitempty"`
		Response  json.RawMessage `json:"response"`
		Randomize json.RawMessage `json:"randomize,omitempty"`
		Headers   json.RawMessage `json:"headers,omitempty"`
	}
	out := make([]detail, 0, len(apis))
	for _, a := range apis {
		out = append(out, detail{
			ID: a.ID, Method: a.Method, Path: withSlash(a.Endpoint), Status: a.StatusCode, Delay: a.Delay,
			Response: json.RawMessage(a.Response), Randomize: json.RawMessage(a.Randomize), Headers: json.RawMessage(a.Headers),
		})
	}
	b, _ := json.Marshal(out)
	return string(b), false
}

func createMock(input json.RawMessage) (string, bool) {
	var args struct {
		Method     string          `json:"method"`
		Endpoint   string          `json:"endpoint"`
		Response   string          `json:"response"`
		StatusCode int             `json:"statusCode"`
		Delay      int             `json:"delay"`
		Randomize  json.RawMessage `json:"randomize"`
		Headers    json.RawMessage `json:"headers"`
	}
	if err := json.Unmarshal(input, &args); err != nil {
		return "invalid arguments: " + err.Error(), true
	}
	if msg, bad := validateMock(args.Method, args.Endpoint, args.Delay); bad {
		return msg, true
	}
	api := &core.Api{
		Endpoint:   args.Endpoint,
		Method:     strings.ToUpper(args.Method),
		StatusCode: args.StatusCode,
		Delay:      args.Delay,
		Response:   toJSON(args.Response),
		Randomize:  rawObject(args.Randomize),
		Headers:    rawObject(args.Headers),
	}
	if err := core.InsertApi(api); err != nil { // normalizes endpoint, sets Key, validates
		return "create failed: " + err.Error(), true
	}
	return fmt.Sprintf(`{"id":%d,"created":"%s %s","status":%d}`, api.ID, api.Method, withSlash(api.Endpoint), api.StatusCode), false
}

func updateMock(input json.RawMessage) (string, bool) {
	var args struct {
		ID         uint            `json:"id"`
		Method     string          `json:"method"`
		Endpoint   string          `json:"endpoint"`
		Response   string          `json:"response"`
		StatusCode int             `json:"statusCode"`
		Delay      int             `json:"delay"`
		Randomize  json.RawMessage `json:"randomize"`
		Headers    json.RawMessage `json:"headers"`
	}
	if err := json.Unmarshal(input, &args); err != nil {
		return "invalid arguments: " + err.Error(), true
	}
	if msg, bad := validateMock(args.Method, args.Endpoint, args.Delay); bad {
		return msg, true
	}
	var existing core.Api
	if err := database.DBConn.Where("id = ?", args.ID).First(&existing).Error; err != nil {
		return fmt.Sprintf("mock #%d not found", args.ID), true
	}
	endpoint := strings.TrimLeft(args.Endpoint, "/")
	existing.Method = strings.ToUpper(args.Method)
	existing.Endpoint = endpoint
	existing.Response = toJSON(args.Response)
	existing.Randomize = rawObject(args.Randomize)
	existing.Headers = rawObject(args.Headers)
	existing.StatusCode = args.StatusCode
	existing.Delay = args.Delay
	existing.Key = existing.Method + endpoint
	if existing.StatusCode == 0 {
		existing.StatusCode = 200
	}
	if err := database.DBConn.Save(&existing).Error; err != nil {
		return "update failed: " + err.Error(), true
	}
	return fmt.Sprintf(`{"id":%d,"updated":"%s %s"}`, existing.ID, existing.Method, withSlash(existing.Endpoint)), false
}

func deleteMock(input json.RawMessage) (string, bool) {
	var args struct {
		ID uint `json:"id"`
	}
	if err := json.Unmarshal(input, &args); err != nil {
		return "invalid arguments: " + err.Error(), true
	}
	res := database.DBConn.Unscoped().Where("id = ?", args.ID).Delete(&core.Api{})
	if res.Error != nil {
		return "delete failed: " + res.Error.Error(), true
	}
	// Report a no-op as an error instead of a false success — otherwise the assistant claims it
	// deleted a mock that was never there (e.g. a stale/wrong id).
	if res.RowsAffected == 0 {
		return fmt.Sprintf("no mock with id %d — nothing deleted", args.ID), true
	}
	return fmt.Sprintf(`{"deleted":%d}`, args.ID), false
}

// toJSON turns a model-supplied response string into valid JSON: if it's already valid JSON,
// keep it; otherwise store it as a JSON string literal.
func toJSON(s string) datatypes.JSON {
	t := strings.TrimSpace(s)
	if t == "" {
		return datatypes.JSON([]byte("{}"))
	}
	if json.Valid([]byte(t)) {
		return datatypes.JSON([]byte(t))
	}
	b, _ := json.Marshal(s)
	return datatypes.JSON(b)
}

func withSlash(p string) string {
	if strings.HasPrefix(p, "/") {
		return p
	}
	return "/" + p
}

// rawObject returns the raw JSON if it's a non-empty object, else nil (so it stores as NULL,
// meaning "no randomization" — a fully-replacing update clears it when omitted).
func rawObject(r json.RawMessage) datatypes.JSON {
	s := strings.TrimSpace(string(r))
	if s == "" || s == "null" || s == "{}" {
		return nil
	}
	return datatypes.JSON(r)
}
