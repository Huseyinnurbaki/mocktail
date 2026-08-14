package ai

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
)

// ConfigResponse is the frontend's view of AI config — it never contains the raw key.
type ConfigResponse struct {
	Configured bool   `json:"configured"`
	Source     string `json:"source"` // "env" | "stored" | "none"
	Provider   string `json:"provider"`
	Model      string `json:"model"`
	KeyHint    string `json:"keyHint,omitempty"`
	// Editable reports whether the key can be set/cleared from THIS session — true only on a
	// loopback client with no env-managed key. False for a remote/containerized dashboard, so
	// the UI can point the user at the MOCKTAIL_AI_API_KEY_<PROVIDER> env var instead of a dead input.
	Editable bool `json:"editable"`
}

func buildConfig() ConfigResponse {
	key, source := Resolve()
	p, _ := Active()
	providerID := resolveProviderID()
	return ConfigResponse{
		Configured: key != "",
		Source:     source,
		Provider:   providerID,
		Model:      resolveModel(p),
		KeyHint:    keyHint(key),
	}
}

// GetConfig — GET /core/v1/ai/config. Reports whether a key is set and where from, plus a
// masked hint (never the key itself) and whether it's settable from this session.
func GetConfig(c *fiber.Ctx) error {
	cfg := buildConfig()
	// Settable only from a loopback client and when no env var is managing the active provider's key.
	cfg.Editable = isLoopback(c) && cfg.Source != "env"
	return c.JSON(cfg)
}

// GetProviders — GET /core/v1/ai/providers. Powers the Settings dropdown (data-driven from
// the registry) and reports the active one. There is no env var for provider selection.
func GetProviders(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"providers": Providers(), "active": resolveProviderID()})
}

// PostConfig — POST /core/v1/ai/config. Sets the key and/or model. The key may only be set
// from a loopback client (a browser never sends a key over a network), and never when an env
// key is managing it. Setting a key validates it by fetching models.
func PostConfig(c *fiber.Ctx) error {
	var body struct {
		APIKey   *string `json:"apiKey"`
		Model    *string `json:"model"`
		Provider *string `json:"provider"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Provider != nil {
		id := strings.TrimSpace(*body.Provider)
		if _, ok := registry[id]; !ok {
			return c.Status(400).JSON(fiber.Map{"error": "unknown provider: " + id})
		}
		s := loadSettings()
		s.Provider = id
		if err := saveSettings(s); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "failed to save provider: " + err.Error()})
		}
	}

	if body.APIKey != nil {
		provider := resolveProviderID()
		if !isLoopback(c) {
			return c.Status(403).JSON(fiber.Map{"error": "API key can only be set from a local (loopback) session"})
		}
		if envKeyFor(provider) != "" {
			return c.Status(409).JSON(fiber.Map{"error": "API key is managed via an environment variable and cannot be changed here"})
		}
		key := strings.TrimSpace(*body.APIKey)
		if key == "" {
			return c.Status(400).JSON(fiber.Map{"error": "apiKey is empty (use DELETE to clear)"})
		}
		p, err := Active()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		// Validate the key by listing models before storing it.
		if _, err := p.ListModels(c.Context(), key); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "key rejected by provider: " + err.Error()})
		}
		if err := keyStore.Set(provider, key); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "failed to store key: " + err.Error()})
		}
	}

	if body.Model != nil {
		s := loadSettings()
		s.Model = strings.TrimSpace(*body.Model)
		if err := saveSettings(s); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "failed to save model: " + err.Error()})
		}
	}

	return c.JSON(buildConfig())
}

// DeleteConfig — DELETE /core/v1/ai/config. Clears the active provider's stored key
// (env-managed keys can't be cleared).
func DeleteConfig(c *fiber.Ctx) error {
	provider := resolveProviderID()
	if envKeyFor(provider) != "" {
		return c.Status(409).JSON(fiber.Map{"error": "API key is managed via an environment variable"})
	}
	if err := keyStore.Delete(provider); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(buildConfig())
}

// ModelsResponse tells the UI whether the list is live or the hardcoded safety net.
type ModelsResponse struct {
	Models []Model `json:"models"`
	Source string  `json:"source"`           // "live" | "fallback"
	Reason string  `json:"reason,omitempty"` // why we fell back
}

// GetModels — GET /core/v1/ai/models. Live from the provider; falls back to the labeled
// hardcoded list when the call fails (no/invalid key, offline).
func GetModels(c *fiber.Ctx) error {
	p, err := Active()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	key, _ := Resolve()
	if key == "" {
		return c.JSON(ModelsResponse{Models: p.FallbackModels(), Source: "fallback", Reason: "no-key"})
	}
	models, err := p.ListModels(c.Context(), key)
	if err != nil {
		return c.JSON(ModelsResponse{Models: p.FallbackModels(), Source: "fallback", Reason: err.Error()})
	}
	return c.JSON(ModelsResponse{Models: models, Source: "live"})
}

// PostChat — POST /core/v1/ai/chat. Streams the assistant reply as Server-Sent Events.
// The transcript is provided by the client (backend is stateless / no DB); it's capped as a
// backstop. Each token is a `data:` frame; the stream ends with an `event: done` frame, or an
// `event: error` frame on failure.
func PostChat(c *fiber.Ctx) error {
	key, _ := Resolve()
	if key == "" {
		return c.Status(400).JSON(fiber.Map{"error": "No API key configured"})
	}
	var body struct {
		Messages  []Message `json:"messages"`
		Model     string    `json:"model"`
		MaxTokens int       `json:"maxTokens"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if len(body.Messages) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "messages is empty"})
	}
	// Backstop the transcript length regardless of what the client sends.
	if len(body.Messages) > MaxContextMessages {
		body.Messages = body.Messages[len(body.Messages)-MaxContextMessages:]
	}

	p, err := Active()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	model := body.Model
	if model == "" {
		model = resolveModel(p)
	}
	maxTokens := body.MaxTokens
	if maxTokens <= 0 {
		maxTokens = DefaultMaxTokens
	}
	if maxTokens > maxTokensCeiling {
		maxTokens = maxTokensCeiling
	}

	// The mocks are NOT injected up front — the assistant reads them only when a question
	// needs it, via the list_mocks / get_mock tools. Keeps every message cheap and private.

	// Detach from the request context: SetBodyStreamWriter runs after this handler returns,
	// so the upstream call gets its own context, cancelled when the client disconnects.
	ctx, cancel := context.WithCancel(context.Background())
	ch, err := p.Agent(ctx, key, body.Messages, ChatOptions{Model: model, MaxTokens: maxTokens, System: SystemPrompt}, mockTools(), executeMockTool)
	if err != nil {
		cancel()
		return c.Status(502).JSON(fiber.Map{"error": err.Error()})
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Context().SetBodyStreamWriter(fasthttp.StreamWriter(func(w *bufio.Writer) {
		defer cancel()
		for ev := range ch {
			switch ev.Kind {
			case "text":
				writeSSE(w, "", fiber.Map{"text": ev.Text})
			case "tool":
				writeSSE(w, "tool", fiber.Map{"name": ev.Tool, "note": ev.Note})
			case "error":
				writeSSE(w, "error", fiber.Map{"message": ev.Err.Error()})
				w.Flush()
				return
			case "done":
				writeSSE(w, "done", fiber.Map{})
				w.Flush()
				return
			}
			if err := w.Flush(); err != nil {
				return // client disconnected; defer cancels the upstream call
			}
		}
	}))
	return nil
}

// writeSSE writes one SSE frame. An empty event name emits a default (message) event.
func writeSSE(w *bufio.Writer, event string, data any) {
	b, _ := json.Marshal(data)
	if event != "" {
		fmt.Fprintf(w, "event: %s\n", event)
	}
	fmt.Fprintf(w, "data: %s\n\n", b)
}

// isLoopback reports whether the request came from the local machine. Unspecified addresses
// (0.0.0.0/::) only appear in in-process tests, so they're treated as local too.
func isLoopback(c *fiber.Ctx) bool {
	ip := net.ParseIP(c.IP())
	return ip != nil && (ip.IsLoopback() || ip.IsUnspecified())
}
