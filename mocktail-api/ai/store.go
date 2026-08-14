package ai

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/zalando/go-keyring"
)

// The AI key is an outbound secret, resolved for the active provider. At rest it lives, in order:
//   1. env MOCKTAIL_AI_API_KEY_<PROVIDER> (e.g. _ANTHROPIC), then the deprecated generic
//      MOCKTAIL_AI_API_KEY fallback — containers; operator-managed, the app never writes it.
//   2. OS keychain (macOS Keychain / Windows Credential Manager / Linux Secret Service), per provider.
//   3. 0600 file per provider in the app-data dir — headless Linux with no Secret Service.
// The frontend never receives the raw key; GET /ai/config returns only a masked hint.

const keychainService = "mocktail-ai"

// keychainUserFor scopes the stored key per provider (e.g. "apikey-anthropic") so keys for
// different providers never clobber each other.
func keychainUserFor(provider string) string { return "apikey-" + provider }

// KeyStore is the mutable at-rest store for a user-entered key, scoped by provider (env is handled
// separately in Resolve). Swappable so tests can point at a temp dir instead of the real keychain.
type KeyStore interface {
	Get(provider string) (string, error)
	Set(provider, key string) error
	Delete(provider string) error
}

// keyStore is the active mutable store. Default: keychain with a 0600-file fallback.
// Tests override this (and keyDir) to stay off the real OS keychain.
var keyStore KeyStore = compositeStore{
	primary:  keychainStore{},
	fallback: &fileStore{dir: &keyDir},
}

// --- keychain-backed store (desktop) ---

type keychainStore struct{}

func (keychainStore) Get(provider string) (string, error) {
	v, err := keyring.Get(keychainService, keychainUserFor(provider))
	if errors.Is(err, keyring.ErrNotFound) {
		return "", nil
	}
	return v, err
}
func (keychainStore) Set(provider, v string) error {
	return keyring.Set(keychainService, keychainUserFor(provider), v)
}
func (keychainStore) Delete(provider string) error {
	err := keyring.Delete(keychainService, keychainUserFor(provider))
	if errors.Is(err, keyring.ErrNotFound) {
		return nil
	}
	return err
}

// --- 0600 file store (headless fallback) ---

type fileStore struct{ dir *string }

func (f *fileStore) file(provider string) string {
	return filepath.Join(*f.dir, "ai_key_"+provider)
}
func (f *fileStore) Get(provider string) (string, error) {
	b, err := os.ReadFile(f.file(provider))
	if errors.Is(err, os.ErrNotExist) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return string(b), nil
}
func (f *fileStore) Set(provider, v string) error {
	if err := os.MkdirAll(*f.dir, 0700); err != nil {
		return err
	}
	return os.WriteFile(f.file(provider), []byte(v), 0600)
}
func (f *fileStore) Delete(provider string) error {
	err := os.Remove(f.file(provider))
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

func (c compositeStore) Get(provider string) (string, error) {
	if v, err := c.primary.Get(provider); err == nil && v != "" {
		return v, nil
	}
	return c.fallback.Get(provider)
}
func (c compositeStore) Set(provider, v string) error {
	if err := c.primary.Set(provider, v); err == nil {
		return nil
	}
	return c.fallback.Set(provider, v)
}
func (c compositeStore) Delete(provider string) error {
	_ = c.primary.Delete(provider)
	return c.fallback.Delete(provider)
}

// Resolve returns the active provider's key and where it came from: "env", "stored", or "none".
// Env wins and makes the key read-only from the frontend's perspective.
func Resolve() (key, source string) {
	provider := resolveProviderID()
	if v := envKeyFor(provider); v != "" {
		return v, "env"
	}
	if v, err := keyStore.Get(provider); err == nil && v != "" {
		return v, "stored"
	}
	return "", "none"
}

// envKeyFor returns the operator-set key for a provider: the per-provider var
// (e.g. MOCKTAIL_AI_API_KEY_ANTHROPIC) if set, else the deprecated generic MOCKTAIL_AI_API_KEY fallback.
func envKeyFor(provider string) string { return perProviderEnv(EnvAPIKey, provider) }

// envBaseURLFor returns the endpoint override for a provider: the per-provider var
// (e.g. MOCKTAIL_AI_BASE_URL_ANTHROPIC) if set, else the generic MOCKTAIL_AI_BASE_URL fallback.
// Used to route a provider through an AI gateway/proxy (and by tests to point at a stub).
func envBaseURLFor(provider string) string { return perProviderEnv(EnvBaseURL, provider) }

// providerEnvKey builds MOCKTAIL_AI_API_KEY_<PROVIDER>, e.g. MOCKTAIL_AI_API_KEY_ANTHROPIC.
func providerEnvKey(provider string) string { return EnvAPIKey + "_" + strings.ToUpper(provider) }

// perProviderEnv reads base+"_"+PROVIDER (e.g. MOCKTAIL_AI_API_KEY_ANTHROPIC) if set, else the
// generic base var — so operator config can be scoped per provider or shared across all of them.
func perProviderEnv(base, provider string) string {
	if v := os.Getenv(base + "_" + strings.ToUpper(provider)); v != "" {
		return v
	}
	return os.Getenv(base)
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
	keyDir           = defaultConfigDir()          // holds per-provider ai_key_<provider> files
	settingsFilePath = defaultPath("ai_config.json")
)

func defaultConfigDir() string {
	if dir, err := os.UserConfigDir(); err == nil {
		return filepath.Join(dir, "mocktail")
	}
	return "db"
}

func defaultPath(name string) string {
	return filepath.Join(defaultConfigDir(), name)
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
