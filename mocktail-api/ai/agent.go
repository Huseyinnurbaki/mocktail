package ai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
)

// Agent implements the tool-using loop for Anthropic. Each iteration streams one model turn
// (forwarding text deltas + tool activity as AgentEvents); if the turn ends in tool_use, the
// tools are executed via exec and their results fed back, and the loop continues until the
// model answers without calling a tool (or the iteration cap is hit).
func (a anthropic) Agent(
	ctx context.Context, apiKey string, msgs []Message, opts ChatOptions, tools []ToolSpec, exec ToolExecutor,
) (<-chan AgentEvent, error) {
	// Seed the running message list from the plain chat history.
	convo := make([]map[string]any, 0, len(msgs)+4)
	for _, m := range msgs {
		convo = append(convo, map[string]any{"role": m.Role, "content": m.Content})
	}

	ch := make(chan AgentEvent)
	go func() {
		defer close(ch)
		for iter := 0; iter < maxAgentIters; iter++ {
			blocks, toolUses, stopReason, err := a.streamTurn(ctx, apiKey, opts, tools, convo, ch)
			if err != nil {
				emit(ctx, ch, AgentEvent{Kind: "error", Err: err})
				return
			}
			convo = append(convo, map[string]any{"role": "assistant", "content": blocks})

			if stopReason != "tool_use" || len(toolUses) == 0 {
				emit(ctx, ch, AgentEvent{Kind: "done"})
				return
			}

			results := make([]map[string]any, 0, len(toolUses))
			for _, tu := range toolUses {
				emit(ctx, ch, AgentEvent{Kind: "tool", Tool: tu.Name, Note: toolNote(tu.Name, tu.Input)})
				out, isErr := exec(tu.Name, tu.Input)
				results = append(results, map[string]any{
					"type":        "tool_result",
					"tool_use_id": tu.ID,
					"content":     out,
					"is_error":    isErr,
				})
			}
			convo = append(convo, map[string]any{"role": "user", "content": results})
		}
		emit(ctx, ch, AgentEvent{Kind: "error", Err: fmt.Errorf("assistant exceeded %d tool steps", maxAgentIters)})
	}()
	return ch, nil
}

func emit(ctx context.Context, ch chan<- AgentEvent, e AgentEvent) {
	select {
	case ch <- e:
	case <-ctx.Done():
	}
}

// blockAcc accumulates one streamed content block (text or tool_use) across deltas.
type blockAcc struct {
	kind    string // "text" | "tool_use"
	text    strings.Builder
	id      string
	name    string
	jsonBuf strings.Builder
}

// streamTurn runs one streaming /v1/messages call, emitting text deltas as it goes, and
// returns the assistant content blocks (to append to the conversation), the tool_use calls,
// and the stop reason.
func (a anthropic) streamTurn(
	ctx context.Context, apiKey string, opts ChatOptions, tools []ToolSpec, convo []map[string]any, ch chan<- AgentEvent,
) ([]map[string]any, []ToolCall, string, error) {
	maxTokens := opts.MaxTokens
	if maxTokens <= 0 {
		maxTokens = DefaultMaxTokens
	}
	payload := map[string]any{
		"model":      opts.Model,
		"max_tokens": maxTokens,
		"stream":     true,
		"messages":   convo,
	}
	if opts.System != "" {
		payload["system"] = opts.System
	}
	if len(tools) > 0 {
		payload["tools"] = tools
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, nil, "", err
	}
	req, err := a.newRequest(ctx, apiKey, http.MethodPost, "/v1/messages", bytes.NewReader(body))
	if err != nil {
		return nil, nil, "", err
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, nil, "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, nil, "", apiError(resp)
	}

	accs := map[int]*blockAcc{}
	order := []int{}
	stopReason := ""

	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		if ctx.Err() != nil {
			return nil, nil, "", ctx.Err()
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
			Type         string `json:"type"`
			Index        int    `json:"index"`
			ContentBlock struct {
				Type string `json:"type"`
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"content_block"`
			Delta struct {
				Type        string `json:"type"`
				Text        string `json:"text"`
				PartialJSON string `json:"partial_json"`
				StopReason  string `json:"stop_reason"`
			} `json:"delta"`
			Error struct {
				Message string `json:"message"`
			} `json:"error"`
		}
		if err := json.Unmarshal([]byte(data), &evt); err != nil {
			continue
		}
		switch evt.Type {
		case "content_block_start":
			accs[evt.Index] = &blockAcc{kind: evt.ContentBlock.Type, id: evt.ContentBlock.ID, name: evt.ContentBlock.Name}
			order = append(order, evt.Index)
		case "content_block_delta":
			b := accs[evt.Index]
			if b == nil { // tolerant: some streams (and our test stub) skip content_block_start
				b = &blockAcc{kind: "text"}
				accs[evt.Index] = b
				order = append(order, evt.Index)
			}
			switch evt.Delta.Type {
			case "text_delta":
				b.text.WriteString(evt.Delta.Text)
				if evt.Delta.Text != "" {
					emit(ctx, ch, AgentEvent{Kind: "text", Text: evt.Delta.Text})
				}
			case "input_json_delta":
				b.jsonBuf.WriteString(evt.Delta.PartialJSON)
			}
		case "message_delta":
			if evt.Delta.StopReason != "" {
				stopReason = evt.Delta.StopReason
			}
		case "message_stop":
			return assemble(accs, order, stopReason)
		case "error":
			msg := evt.Error.Message
			if msg == "" {
				msg = "stream error"
			}
			return nil, nil, "", fmt.Errorf("anthropic: %s", msg)
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, nil, "", err
	}
	return assemble(accs, order, stopReason)
}

// assemble turns the accumulated blocks into the assistant content array + the tool calls.
func assemble(accs map[int]*blockAcc, order []int, stopReason string) ([]map[string]any, []ToolCall, string, error) {
	sort.Ints(order)
	blocks := make([]map[string]any, 0, len(order))
	var toolUses []ToolCall
	for _, idx := range order {
		b := accs[idx]
		if b.kind == "tool_use" {
			raw := b.jsonBuf.String()
			if strings.TrimSpace(raw) == "" {
				raw = "{}"
			}
			var input any
			_ = json.Unmarshal([]byte(raw), &input)
			blocks = append(blocks, map[string]any{"type": "tool_use", "id": b.id, "name": b.name, "input": input})
			toolUses = append(toolUses, ToolCall{ID: b.id, Name: b.name, Input: json.RawMessage(raw)})
		} else {
			blocks = append(blocks, map[string]any{"type": "text", "text": b.text.String()})
		}
	}
	return blocks, toolUses, stopReason, nil
}
