package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

// useTempStore points the key + settings at a temp dir and swaps the composite (keychain)
// store for a plain file store — so tests never touch the real OS keychain or user config.
func useTempStore(t *testing.T) {
	t.Helper()
	dir := t.TempDir()
	origKeyDir, origSettings, origStore := keyDir, settingsFilePath, keyStore
	keyDir = dir
	settingsFilePath = filepath.Join(dir, "ai_config.json")
	keyStore = &fileStore{dir: &keyDir}
	t.Cleanup(func() { keyDir, settingsFilePath, keyStore = origKeyDir, origSettings, origStore })
	t.Setenv(EnvAPIKey, "")
	t.Setenv(EnvModel, "")
	t.Setenv(EnvBaseURL, "")
}

// stubAnthropic stands up a fake Anthropic API and points EnvBaseURL at it.
func stubAnthropic(t *testing.T) {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasPrefix(r.URL.Path, "/v1/models"):
			_ = json.NewEncoder(w).Encode(map[string]any{"data": []map[string]string{
				{"id": "claude-haiku-4-5-20251001", "display_name": "Claude Haiku 4.5"},
				{"id": "claude-sonnet-5", "display_name": "Claude Sonnet 5"},
				{"id": "gpt-not-claude", "display_name": "Should be filtered"},
			}})
		case r.URL.Path == "/v1/messages":
			w.Header().Set("Content-Type", "text/event-stream")
			fl, _ := w.(http.Flusher)
			for _, word := range []string{"Hello", " ", "world"} {
				io.WriteString(w, "event: content_block_delta\n")
				io.WriteString(w, `data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"`+word+"\"}}\n\n")
				if fl != nil {
					fl.Flush()
				}
			}
			io.WriteString(w, "event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n")
		default:
			http.Error(w, "not found", 404)
		}
	}))
	t.Cleanup(srv.Close)
	t.Setenv(EnvBaseURL, srv.URL)
}

func aiApp() *fiber.App {
	app := fiber.New()
	app.Get("/ai/config", GetConfig)
	app.Post("/ai/config", PostConfig)
	app.Delete("/ai/config", DeleteConfig)
	app.Get("/ai/providers", GetProviders)
	app.Get("/ai/models", GetModels)
	app.Post("/ai/chat", PostChat)
	return app
}

func TestResolveKeySources(t *testing.T) {
	t.Run("none by default", func(t *testing.T) {
		useTempStore(t)
		if k, src := Resolve(); k != "" || src != "none" {
			t.Fatalf("Resolve() = (%q,%q), want (\"\",\"none\")", k, src)
		}
	})
	t.Run("env wins", func(t *testing.T) {
		useTempStore(t)
		_ = keyStore.Set(resolveProviderID(), "stored-key")
		t.Setenv(EnvAPIKey, "env-key")
		if k, src := Resolve(); k != "env-key" || src != "env" {
			t.Fatalf("Resolve() = (%q,%q), want (\"env-key\",\"env\")", k, src)
		}
	})
	t.Run("per-provider env wins over generic", func(t *testing.T) {
		useTempStore(t)
		t.Setenv(EnvAPIKey, "generic-key")
		t.Setenv(providerEnvKey(resolveProviderID()), "provider-key") // MOCKTAIL_AI_API_KEY_ANTHROPIC
		if k, src := Resolve(); k != "provider-key" || src != "env" {
			t.Fatalf("Resolve() = (%q,%q), want (\"provider-key\",\"env\")", k, src)
		}
	})
	t.Run("stored when no env", func(t *testing.T) {
		useTempStore(t)
		if err := keyStore.Set(resolveProviderID(), "stored-key"); err != nil {
			t.Fatalf("set: %v", err)
		}
		if k, src := Resolve(); k != "stored-key" || src != "stored" {
			t.Fatalf("Resolve() = (%q,%q), want (\"stored-key\",\"stored\")", k, src)
		}
	})
}

func TestKeyHint(t *testing.T) {
	cases := map[string]string{"": "", "short": "…", "sk-ant-abcd1234": "sk-…1234"}
	for in, want := range cases {
		if got := keyHint(in); got != want {
			t.Fatalf("keyHint(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestResolveModel(t *testing.T) {
	p, _ := Active()
	t.Run("provider default when unset", func(t *testing.T) {
		useTempStore(t)
		if got := resolveModel(p); got != p.DefaultModel() {
			t.Fatalf("resolveModel = %q, want default %q", got, p.DefaultModel())
		}
	})
	t.Run("stored setting overrides default", func(t *testing.T) {
		useTempStore(t)
		_ = saveSettings(aiSettings{Model: "claude-sonnet-5"})
		if got := resolveModel(p); got != "claude-sonnet-5" {
			t.Fatalf("resolveModel = %q, want stored", got)
		}
	})
	t.Run("env overrides everything", func(t *testing.T) {
		useTempStore(t)
		_ = saveSettings(aiSettings{Model: "claude-sonnet-5"})
		t.Setenv(EnvModel, "claude-opus-4-8")
		if got := resolveModel(p); got != "claude-opus-4-8" {
			t.Fatalf("resolveModel = %q, want env", got)
		}
	})
}

func TestAnthropicListModels(t *testing.T) {
	useTempStore(t)
	stubAnthropic(t)
	p, _ := Active()
	models, err := p.ListModels(context.Background(), "test-key")
	if err != nil {
		t.Fatalf("ListModels: %v", err)
	}
	if len(models) != 2 {
		t.Fatalf("got %d models, want 2 (non-claude filtered)", len(models))
	}
	if models[0].ID != "claude-haiku-4-5-20251001" || !models[0].Recommended {
		t.Fatalf("first model = %+v, want recommended haiku", models[0])
	}
	if models[1].Recommended {
		t.Fatalf("second model should not be recommended: %+v", models[1])
	}
}

func TestAnthropicListModelsErrors(t *testing.T) {
	useTempStore(t)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(401)
		io.WriteString(w, `{"error":{"message":"invalid x-api-key"}}`)
	}))
	t.Cleanup(srv.Close)
	t.Setenv(EnvBaseURL, srv.URL)
	p, _ := Active()
	if _, err := p.ListModels(context.Background(), "bad"); err == nil {
		t.Fatal("expected error on 401, got nil")
	}
}

func TestAnthropicChatStream(t *testing.T) {
	useTempStore(t)
	stubAnthropic(t)
	p, _ := Active()
	ch, err := p.Chat(context.Background(), "key", []Message{{Role: "user", Content: "hi"}}, ChatOptions{Model: "claude-haiku-4-5-20251001"})
	if err != nil {
		t.Fatalf("Chat: %v", err)
	}
	var sb strings.Builder
	for chunk := range ch {
		if chunk.Err != nil {
			t.Fatalf("stream error: %v", chunk.Err)
		}
		sb.WriteString(chunk.Text)
	}
	if sb.String() != "Hello world" {
		t.Fatalf("streamed text = %q, want %q", sb.String(), "Hello world")
	}
}

func TestGetModelsFallbackAndLive(t *testing.T) {
	app := aiApp()
	t.Run("fallback when no key", func(t *testing.T) {
		useTempStore(t)
		resp, _ := app.Test(httptest.NewRequest("GET", "/ai/models", nil), -1)
		var out ModelsResponse
		json.NewDecoder(resp.Body).Decode(&out)
		if out.Source != "fallback" || out.Reason != "no-key" || len(out.Models) == 0 {
			t.Fatalf("got %+v, want fallback/no-key with models", out)
		}
	})
	t.Run("live when key present", func(t *testing.T) {
		useTempStore(t)
		stubAnthropic(t)
		_ = keyStore.Set(resolveProviderID(), "key")
		resp, _ := app.Test(httptest.NewRequest("GET", "/ai/models", nil), -1)
		var out ModelsResponse
		json.NewDecoder(resp.Body).Decode(&out)
		if out.Source != "live" || len(out.Models) != 2 {
			t.Fatalf("got %+v, want live with 2 models", out)
		}
	})
}

func TestConfigFlow(t *testing.T) {
	useTempStore(t)
	stubAnthropic(t)
	app := aiApp()

	// starts unconfigured
	var cfg ConfigResponse
	resp, _ := app.Test(httptest.NewRequest("GET", "/ai/config", nil), -1)
	json.NewDecoder(resp.Body).Decode(&cfg)
	if cfg.Configured || cfg.Source != "none" {
		t.Fatalf("initial config = %+v, want unconfigured", cfg)
	}

	// set a key (validated against the stub) + a model
	body, _ := json.Marshal(map[string]string{"apiKey": "sk-ant-secret1234", "model": "claude-sonnet-5"})
	req := httptest.NewRequest("POST", "/ai/config", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ = app.Test(req, -1)
	if resp.StatusCode != 200 {
		t.Fatalf("POST config status = %d, want 200", resp.StatusCode)
	}
	json.NewDecoder(resp.Body).Decode(&cfg)
	if !cfg.Configured || cfg.Source != "stored" || cfg.Model != "claude-sonnet-5" {
		t.Fatalf("after set: %+v", cfg)
	}
	if cfg.KeyHint != "sk-…1234" || strings.Contains(cfg.KeyHint, "secret") {
		t.Fatalf("keyHint leaks or wrong: %q", cfg.KeyHint)
	}

	// delete clears it
	resp, _ = app.Test(httptest.NewRequest("DELETE", "/ai/config", nil), -1)
	json.NewDecoder(resp.Body).Decode(&cfg)
	if cfg.Configured || cfg.Source != "none" {
		t.Fatalf("after delete: %+v", cfg)
	}
}

func TestConfigEnvManagedIsReadOnly(t *testing.T) {
	useTempStore(t)
	t.Setenv(EnvAPIKey, "env-managed")
	app := aiApp()

	body, _ := json.Marshal(map[string]string{"apiKey": "sk-new"})
	req := httptest.NewRequest("POST", "/ai/config", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 409 {
		t.Fatalf("POST key while env-managed: status %d, want 409", resp.StatusCode)
	}

	resp, _ = app.Test(httptest.NewRequest("DELETE", "/ai/config", nil), -1)
	if resp.StatusCode != 409 {
		t.Fatalf("DELETE while env-managed: status %d, want 409", resp.StatusCode)
	}
}

func TestProvidersEndpointAndSelection(t *testing.T) {
	useTempStore(t)
	app := aiApp()

	resp, _ := app.Test(httptest.NewRequest("GET", "/ai/providers", nil), -1)
	var out struct {
		Providers []ProviderInfo `json:"providers"`
		Active    string         `json:"active"`
	}
	json.NewDecoder(resp.Body).Decode(&out)
	if len(out.Providers) == 0 || out.Providers[0].ID != "anthropic" || out.Providers[0].Name == "" {
		t.Fatalf("providers = %+v, want anthropic listed with a name", out.Providers)
	}
	if out.Active != "anthropic" {
		t.Fatalf("active = %q, want anthropic (default)", out.Active)
	}

	// Selecting a known provider persists; an unknown one is rejected.
	if code := postProvider(t, app, "anthropic"); code != 200 {
		t.Fatalf("select anthropic: status %d, want 200", code)
	}
	if resolveProviderID() != "anthropic" {
		t.Fatalf("persisted provider = %q, want anthropic", resolveProviderID())
	}
	if code := postProvider(t, app, "does-not-exist"); code != 400 {
		t.Fatalf("select unknown provider: status %d, want 400", code)
	}
}

func postProvider(t *testing.T, app *fiber.App, id string) int {
	t.Helper()
	body, _ := json.Marshal(map[string]string{"provider": id})
	req := httptest.NewRequest("POST", "/ai/config", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("post provider: %v", err)
	}
	return resp.StatusCode
}

func TestPostChatNoKey(t *testing.T) {
	useTempStore(t)
	app := aiApp()
	body, _ := json.Marshal(map[string]any{"messages": []Message{{Role: "user", Content: "hi"}}})
	req := httptest.NewRequest("POST", "/ai/chat", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 400 {
		t.Fatalf("chat without key: status %d, want 400", resp.StatusCode)
	}
}

func TestPostChatStreamsSSE(t *testing.T) {
	useTempStore(t)
	stubAnthropic(t)
	_ = keyStore.Set(resolveProviderID(), "key")
	app := aiApp()

	body, _ := json.Marshal(map[string]any{"messages": []Message{{Role: "user", Content: "hi"}}})
	req := httptest.NewRequest("POST", "/ai/chat", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("chat: %v", err)
	}
	if ct := resp.Header.Get("Content-Type"); !strings.HasPrefix(ct, "text/event-stream") {
		t.Fatalf("content-type = %q, want text/event-stream", ct)
	}
	raw, _ := io.ReadAll(resp.Body)
	text := extractSSEText(t, string(raw))
	if text != "Hello world" {
		t.Fatalf("assembled SSE text = %q, want %q (raw: %q)", text, "Hello world", raw)
	}
	if !strings.Contains(string(raw), "event: done") {
		t.Fatalf("stream missing done event: %q", raw)
	}
}

// extractSSEText pulls the concatenated {"text":...} payloads out of a data: stream.
func extractSSEText(t *testing.T, body string) string {
	t.Helper()
	var sb strings.Builder
	for _, line := range strings.Split(body, "\n") {
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		var d struct {
			Text string `json:"text"`
		}
		if json.Unmarshal([]byte(strings.TrimSpace(line[5:])), &d) == nil {
			sb.WriteString(d.Text)
		}
	}
	return sb.String()
}
