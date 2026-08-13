package ai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

// anthropic is a hand-rolled client for the Anthropic Messages API — no SDK, so no extra
// dependency and full control over the SSE stream. Request/stream shapes follow the stable
// public API (anthropic-version 2023-06-01).
type anthropic struct{}

func init() { register(anthropic{}) }

const anthropicVersion = "2023-06-01"

func (anthropic) ID() string           { return "anthropic" }
func (anthropic) Name() string         { return "Anthropic (Claude)" }
func (anthropic) DefaultModel() string { return "claude-haiku-4-5-20251001" }

// FallbackModels is the safety-net list shown when the live /v1/models call fails.
// The only place model ids are hardcoded; the live call is authoritative.
func (a anthropic) FallbackModels() []Model {
	return []Model{
		{ID: "claude-haiku-4-5-20251001", DisplayName: "Claude Haiku 4.5", Recommended: true},
		{ID: "claude-sonnet-5", DisplayName: "Claude Sonnet 5"},
		{ID: "claude-opus-4-8", DisplayName: "Claude Opus 4.8"},
	}
}

func (anthropic) baseURL() string {
	if v := os.Getenv(EnvBaseURL); v != "" {
		return strings.TrimRight(v, "/")
	}
	return "https://api.anthropic.com"
}

var httpClient = &http.Client{} // no overall timeout: streaming is long-lived, ctx cancels it

func (a anthropic) newRequest(ctx context.Context, apiKey, method, path string, body io.Reader) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, method, a.baseURL()+path, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", anthropicVersion)
	req.Header.Set("content-type", "application/json")
	return req, nil
}

// ListModels calls GET /v1/models, keeps chat-capable Claude models newest-first (the API
// already returns newest-first), and flags the recommended default.
func (a anthropic) ListModels(ctx context.Context, apiKey string) ([]Model, error) {
	req, err := a.newRequest(ctx, apiKey, http.MethodGet, "/v1/models?limit=100", nil)
	if err != nil {
		return nil, err
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, apiError(resp)
	}
	var parsed struct {
		Data []struct {
			ID          string `json:"id"`
			DisplayName string `json:"display_name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}
	def := a.DefaultModel()
	models := make([]Model, 0, len(parsed.Data))
	for _, m := range parsed.Data {
		if !strings.HasPrefix(m.ID, "claude-") {
			continue
		}
		name := m.DisplayName
		if name == "" {
			name = m.ID
		}
		models = append(models, Model{ID: m.ID, DisplayName: name, Recommended: m.ID == def})
	}
	return models, nil
}

// Chat calls POST /v1/messages with stream:true and turns the SSE event stream into a
// channel of text deltas.
func (a anthropic) Chat(ctx context.Context, apiKey string, msgs []Message, opts ChatOptions) (<-chan ChatChunk, error) {
	maxTokens := opts.MaxTokens
	if maxTokens <= 0 {
		maxTokens = DefaultMaxTokens
	}
	payload := map[string]any{
		"model":      opts.Model,
		"max_tokens": maxTokens,
		"stream":     true,
		"messages":   msgs,
	}
	if opts.System != "" {
		payload["system"] = opts.System
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := a.newRequest(ctx, apiKey, http.MethodPost, "/v1/messages", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		defer resp.Body.Close()
		return nil, apiError(resp)
	}

	ch := make(chan ChatChunk)
	go func() {
		defer close(ch)
		defer resp.Body.Close()
		a.streamSSE(ctx, resp.Body, ch)
	}()
	return ch, nil
}

// streamSSE parses Anthropic's text/event-stream: it forwards text_delta content and
// surfaces error events. It stops on context cancellation (client disconnect) or EOF.
func (a anthropic) streamSSE(ctx context.Context, r io.Reader, ch chan<- ChatChunk) {
	scanner := bufio.NewScanner(r)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024) // allow large data lines
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
		}
		line := scanner.Text()
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		data := strings.TrimSpace(line[len("data:"):])
		if data == "" {
			continue
		}
		var evt struct {
			Type  string `json:"type"`
			Delta struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"delta"`
			Error struct {
				Message string `json:"message"`
			} `json:"error"`
		}
		if err := json.Unmarshal([]byte(data), &evt); err != nil {
			continue // ignore non-JSON keep-alives / pings
		}
		switch evt.Type {
		case "content_block_delta":
			if evt.Delta.Type == "text_delta" && evt.Delta.Text != "" {
				select {
				case ch <- ChatChunk{Text: evt.Delta.Text}:
				case <-ctx.Done():
					return
				}
			}
		case "error":
			msg := evt.Error.Message
			if msg == "" {
				msg = "stream error"
			}
			ch <- ChatChunk{Err: fmt.Errorf("anthropic: %s", msg)}
			return
		case "message_stop":
			return
		}
	}
	if err := scanner.Err(); err != nil && ctx.Err() == nil {
		ch <- ChatChunk{Err: err}
	}
}

// apiError reads an error body and returns a concise, key-free error.
func apiError(resp *http.Response) error {
	b, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	var parsed struct {
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if json.Unmarshal(b, &parsed) == nil && parsed.Error.Message != "" {
		return fmt.Errorf("provider error (%d): %s", resp.StatusCode, parsed.Error.Message)
	}
	return fmt.Errorf("provider error (%d)", resp.StatusCode)
}
