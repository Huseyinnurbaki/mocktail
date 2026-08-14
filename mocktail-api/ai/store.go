package ai

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	"github.com/zalando/go-keyring"
)

// The AI key is an outbound secret. At rest it lives, in order of preference:
//   1. env MOCKTAIL_AI_API_KEY — containers; operator-managed, app never writes it.
//   2. OS keychain (macOS Keychain / Windows Credential Manager / Linux Secret Service) — desktop.
//   3. 0600 file in the app-data dir — headless Linux with no Secret Service (documented fallback).
// The frontend never receives the raw key; GET /ai/config returns only a masked hint.

const (
	keychainService = "mocktail-ai"
	keychainUser    = "apikey"
)

// KeyStore is the mutable at-rest store for a user-entered key (env is handled separately
// in Resolve). Swappable so tests can point at a temp file instead of the real keychain.
type KeyStore interface {
	Get() (string, error)
	Set(string) error
	Delete() error
}

// keyStore is the active mutable store. Default: keychain with a 0600-file fallback.
// Tests override this (and keyFilePath) to stay off the real OS keychain.
var keyStore KeyStore = compositeStore{
	primary:  keychainStore{},
	fallback: &fileStore{path: &keyFilePath},
}

// --- keychain-backed store (desktop) ---

type keychainStore struct{}

func (keychainStore) Get() (string, error) {
	v, err := keyring.Get(keychainService, keychainUser)
	if errors.Is(err, keyring.ErrNotFound) {
		return "", nil
	}
	return v, err
}
func (keychainStore) Set(v string) error { return keyring.Set(keychainService, keychainUser, v) }
func (keychainStore) Delete() error {
	err := keyring.Delete(keychainService, keychainUser)
	if errors.Is(err, keyring.ErrNotFound) {
		return nil
	}
	return err
}

// --- 0600 file store (headless fallback) ---

type fileStore struct{ path *string }

func (f *fileStore) Get() (string, error) {
	b, err := os.ReadFile(*f.path)
	if errors.Is(err, os.ErrNotExist) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return string(b), nil
}
func (f *fileStore) Set(v string) error {
	if err := os.MkdirAll(filepath.Dir(*f.path), 0700); err != nil {
		return err
	}
	return os.WriteFile(*f.path, []byte(v), 0600)
}
func (f *fileStore) Delete() error {
	err := os.Remove(*f.path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	return err
}

// --- composite: try keychain, fall back to file (Secret Service absent) ---

type compositeStore struct {
	primary  KeyStore
	fallback KeyStore
}

func (c compositeStore) Get() (string, error) {
	if v, err := c.primary.Get(); err == nil && v != "" {
		return v, nil
	}
	return c.fallback.Get()
}
func (c compositeStore) Set(v string) error {
	if err := c.primary.Set(v); err == nil {
		return nil
	}
	return c.fallback.Set(v)
}
func (c compositeStore) Delete() error {
	_ = c.primary.Delete()
	return c.fallback.Delete()
}

// Resolve returns the active key and where it came from: "env", "stored", or "none".
// Env wins and makes the key read-only from the frontend's perspective.
func Resolve() (key, source string) {
	if v := os.Getenv(EnvAPIKey); v != "" {
		return v, "env"
	}
	if v, err := keyStore.Get(); err == nil && v != "" {
		return v, "stored"
	}
	return "", "none"
}

// keyHint masks a key to a short, non-reversible hint like "sk-…a1b2" for display.
func keyHint(key string) string {
	if key == "" {
		return ""
	}
	if len(key) <= 8 {
		return "…"
	}
	return key[:3] + "…" + key[len(key)-4:]
}

// --- non-secret settings (provider + model) ---

type aiSettings struct {
	Provider string `json:"provider,omitempty"`
	Model    string `json:"model,omitempty"`
}

// File locations. Package vars so tests can redirect them to a temp dir.
var (
	keyFilePath      = defaultPath("ai_key")
	settingsFilePath = defaultPath("ai_config.json")
)

func defaultPath(name string) string {
	if dir, err := os.UserConfigDir(); err == nil {
		return filepath.Join(dir, "mocktail", name)
	}
	return filepath.Join("db", name)
}

func loadSettings() aiSettings {
	var s aiSettings
	b, err := os.ReadFile(settingsFilePath)
	if err != nil {
		return s
	}
	_ = json.Unmarshal(b, &s)
	return s
}

func saveSettings(s aiSettings) error {
	if err := os.MkdirAll(filepath.Dir(settingsFilePath), 0700); err != nil {
		return err
	}
	b, err := json.Marshal(s)
	if err != nil {
		return err
	}
	return os.WriteFile(settingsFilePath, b, 0600)
}

// resolveModel: explicit env → stored setting → provider default.
func resolveModel(p Provider) string {
	if v := os.Getenv(EnvModel); v != "" {
		return v
	}
	if s := loadSettings(); s.Model != "" {
		return s.Model
	}
	if p != nil {
		return p.DefaultModel()
	}
	return ""
}
