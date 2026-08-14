// Package ai wires real AI providers (chat + model listing) behind a small, pluggable
// interface. Absolute rule: the provider API key is a backend secret — it is never
// returned to or stored by the frontend, and every provider call is server-side.
//
// A single provider is active at a time (default: anthropic). Adding OpenAI/Gemini later
// means implementing the Provider interface and calling register() — no frontend change.
package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
)

// Environment variables that configure the AI layer.
//
// Note: there is deliberately NO env var to *select* the provider. The provider is a UI choice
// (Settings dropdown, data-driven from the registry) persisted server-side — a browser dropdown
// is the right control for it, not an env var. Env is only for the genuinely-headless case:
// injecting the secret key in a container where there's no loopback session to type into.
const (
	EnvModel   = "MOCKTAIL_AI_MODEL"    // optional: pin a model id (else: Settings choice → provider default)
	EnvAPIKey  = "MOCKTAIL_AI_API_KEY"  // operator-set key (containers); read-only, wins over stored
	EnvBaseURL = "MOCKTAIL_AI_BASE_URL" // override the provider base URL (used by tests)
)

// Assistant defaults (server-side constants, easy to tune).
const (
	DefaultMaxTokens   = 1024 // per-reply cap when the client doesn't specify one
	MaxContextMessages = 100  // backstop on transcript length sent to the model
	maxTokensCeiling   = 8192 // hard upper bound on a client-supplied max_tokens
)

// SystemPrompt primes the assistant. Chat-only for now; the agentic (MCP-tool) version
// is a later slice, so this stays a plain helpfulness primer with no tool affordances.
// Style is deliberately terse — this is an in-app helper, not an essay writer.
const SystemPrompt = "You are Mocktail's built-in assistant. Mocktail is a self-hosted mock API " +
	"server with a dashboard. Help with mock endpoints: JSON responses, per-field randomization " +
	"(gofakeit-style generators), response headers, status codes, latency, and MCP.\n\n" +
	"You do NOT have the user's mocks loaded up front — read them only when a question needs it. " +
	"Use list_mocks to see what exists (id, method, path, status) and get_mock (by id or path) to read " +
	"one endpoint's full response body and config. To change things, use create_mock, update_mock, " +
	"delete_mock — don't tell the user to do it manually in the dashboard. Endpoint paths start with " +
	"'/'. After acting, confirm what you did in one short line. Always confirm before delete_mock or " +
	"overwriting an existing mock.\n\n" +
	"CRITICAL — never fake an action. You may ONLY say you created, updated, or deleted a mock if you " +
	"actually called the matching tool THIS turn and it returned success. To delete N mocks, call " +
	"delete_mock once per id — do not just narrate 'Deleted them'. If you didn't call the tool, nothing " +
	"changed, so don't claim it did. Re-run list_mocks after a confirmation to get current ids.\n\n" +
	"Randomization: Mocktail does NOT use {{...}} template placeholders. The response body is static " +
	"JSON; to make fields vary per request, pass the separate `randomize` map — dot-path in the " +
	"response → generator. Example: response {\"id\":\"\",\"email\":\"\",\"age\":0} with randomize " +
	"{\"id\":{\"type\":\"uuid\"},\"email\":{\"type\":\"email\"},\"age\":{\"type\":\"number\",\"min\":18," +
	"\"max\":90}}. For arrays, path through them (e.g. \"users.email\"). Generators: uuid, name, " +
	"firstName, lastName, email, phone, username, url, domain, ipv4, number(min,max), float(min,max), " +
	"price(min,max), bool, word, sentence, paragraph, pastDate, futureDate, city, country, countryCode, " +
	"hexColor, fixed(value). There is no timestamp generator — use pastDate or futureDate.\n\n" +
	"Answer succinctly and precisely. No preamble, no filler, no restating the question, no " +
	"summaries. Plain words, not fancy language. Get straight to the answer — usually one or two " +
	"sentences, a short list, or a code block. Don't explain your reasoning or add caveats unless " +
	"asked. When you show a mock, show only valid JSON. If you don't know, say so in one line."

// Model is a chat model surfaced in the UI's dropdown.
type Model struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
	Recommended bool   `json:"recommended,omitempty"`
}

// Message is one chat turn. Role is "user" or "assistant".
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatOptions controls a single completion.
type ChatOptions struct {
	Model     string
	MaxTokens int
	System    string
}

// ChatChunk is one streamed piece of the assistant's reply. A chunk with a non-nil Err
// is terminal — the stream ends after it.
type ChatChunk struct {
	Text string
	Err  error
}

// maxAgentIters caps how many tool round-trips one agentic turn may take (runaway guard).
const maxAgentIters = 6

// ToolSpec describes a tool exposed to the model (Anthropic tool schema: input_schema is JSON Schema).
type ToolSpec struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	InputSchema map[string]any `json:"input_schema"`
}

// ToolCall is a tool invocation the model requested.
type ToolCall struct {
	ID    string
	Name  string
	Input json.RawMessage
}

// ToolExecutor runs a tool call and returns a result payload plus whether it errored.
type ToolExecutor func(name string, input json.RawMessage) (result string, isError bool)

// AgentEvent is one streamed happening in an agentic turn.
type AgentEvent struct {
	Kind string // "text" | "tool" | "error" | "done"
	Text string // Kind=="text": a text delta
	Tool string // Kind=="tool": tool name
	Note string // Kind=="tool": short human note (what it's doing)
	Err  error  // Kind=="error"
}

// Provider is a pluggable AI backend. Implementations are stateless: the API key is
// passed per-call so a single registered instance can serve every request.
type Provider interface {
	// ID is the registry key (e.g. "anthropic").
	ID() string
	// Name is the human label for the Settings dropdown (e.g. "Anthropic (Claude)").
	Name() string
	// DefaultModel is the recommended model id — a cheap/fast one for the assistant.
	DefaultModel() string
	// FallbackModels is the small hardcoded list used only when ListModels fails
	// (no/invalid key, offline). The only place model ids are written down.
	FallbackModels() []Model
	// ListModels asks the provider for its current chat models, curated newest-first.
	ListModels(ctx context.Context, apiKey string) ([]Model, error)
	// Chat streams a completion. A non-200 upstream is returned as a synchronous error
	// (so the handler can fail before opening an SSE stream); token/stream errors arrive
	// on the channel as a terminal ChatChunk.
	Chat(ctx context.Context, apiKey string, msgs []Message, opts ChatOptions) (<-chan ChatChunk, error)
	// Agent runs an agentic turn: the model may call tools (executed via exec) and the loop
	// continues until it produces a final answer. Streams text deltas + tool activity as
	// AgentEvents (including a terminal "done"/"error").
	Agent(ctx context.Context, apiKey string, msgs []Message, opts ChatOptions, tools []ToolSpec, exec ToolExecutor) (<-chan AgentEvent, error)
}

// registry maps provider id → implementation.
var registry = map[string]Provider{}

func register(p Provider) { registry[p.ID()] = p }

// ProviderInfo is a registry entry for the Settings dropdown.
type ProviderInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// Providers lists every registered provider (for the UI dropdown), sorted by id for stability.
func Providers() []ProviderInfo {
	out := make([]ProviderInfo, 0, len(registry))
	for id, p := range registry {
		out = append(out, ProviderInfo{ID: id, Name: p.Name()})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

// Active returns the configured provider (stored Settings choice → "anthropic" default).
func Active() (Provider, error) {
	id := resolveProviderID()
	p, ok := registry[id]
	if !ok {
		return nil, fmt.Errorf("unknown AI provider %q", id)
	}
	return p, nil
}

// resolveProviderID: the stored Settings choice, else the default. No env override — the
// provider is a dropdown, not an environment variable.
func resolveProviderID() string {
	if s := loadSettings(); s.Provider != "" {
		return s.Provider
	}
	return "anthropic"
}
