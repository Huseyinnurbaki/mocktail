# Example setups

Ready-to-copy configs for common Mocktail deployments. Copy one, tweak, run.

| File | Scenario |
|---|---|
| `docker-compose.basic.yml` | Minimal — no auth, SQLite persisted to `./data` |
| `docker-compose.secured.yml` | Protected mock endpoints + tightened CORS (+ commented planned admin/AI) |

```console
# from an example dir
docker compose -f docker-compose.basic.yml up -d
# open http://localhost:6625
```

## Environment variable reference

**✅ Implemented (usable today):**

| Var | Default | Purpose |
|---|---|---|
| `MOCKTAIL_PORT` | `6625` | Listen port. `auto`/`0` = prefer 6625, scan 6626–6634, else any free port. |
| `MOCKTAIL_DB_PATH` | app-data dir (OS) / `/db/apis.db` in Docker | SQLite file location. |
| `MOCKTAIL_API_KEY` | (unset = open) | Protect **served mocks** (`/mocktail/*`): callers send `X-API-Key` or `?api_key=`. |
| `MOCKTAIL_CORS_ORIGINS` | `*` | Allowed origins (comma-separated). |
| `MOCKTAIL_CORS_METHODS` | `GET,POST,PUT,PATCH,DELETE,OPTIONS` | Allowed methods. |
| `MOCKTAIL_CORS_HEADERS` | `*` | Allowed headers. |
| `MOCKTAIL_CORS_CREDENTIALS` | `false` | Allow credentials (can't be `*` origins when `true`). |
| `MOCKTAIL_BASE_URL` | derived | URL shown in the dashboard (reverse proxy / custom domain). |
| `MOCKTAIL_ADMIN_KEY` | (unset = open) | Auth on the **management API** (`/core/v1/*`). `unset`=off, `<value>`=that key, `auto`=random per launch (printed as a ready URL). Gates the AI endpoints too. |
| `MOCKTAIL_AI_API_KEY_ANTHROPIC` | (unset) | AI provider key, **per provider** (e.g. `_ANTHROPIC`), server-side only. In containers set it here; on desktop enter it in Settings (OS keychain). When set, it wins and the Settings field is read-only. The generic `MOCKTAIL_AI_API_KEY` still works as a **deprecated** fallback. |
| `MOCKTAIL_AI_MODEL` | provider default | Optional: pin a model id (else the Settings choice, else the recommended default). |

> **Provider selection is a Settings dropdown, not an env var** — there is intentionally no
> `MOCKTAIL_AI_PROVIDER`. Env only injects the secret key (headless/container) + an optional model pin.

**🔜 Planned (designed, not yet wired — see `../roadmap.md`):**

| Var | Purpose |
|---|---|
| `MOCKTAIL_DATABASE_URL` | Postgres DSN → use Postgres instead of SQLite. |

> ⚠️ The 🔜 vars are documented here so the intended config surface is visible; they do **nothing yet**.
> They're commented out in the example files and labeled as planned.

## Notes
- **Persistence:** the DB lives at `/db/apis.db` in the image; the examples mount `./data:/db` so it
  survives restarts. Back it up, or export via Settings → Export.
- **Docker build memory:** if you build the image yourself, give Docker **≥ 4 GB** (the pure-Go SQLite
  compile OOMs at the 2 GB default). Running the image needs little.
- **Desktop/CLI:** no compose — the binary uses the OS app-data dir for the DB and `MOCKTAIL_PORT=auto`
  by default in the desktop shell; the provider key goes in the OS keychain via Settings.
