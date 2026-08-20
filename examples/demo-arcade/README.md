# 🕹️ Demo — Mocktail Arcade

A retro CRT high-score board whose backend **is Mocktail**. Same two beats as the Bar demo, different
vibe:

- **MCP / AI builds the backend** — a coding agent reads the `fetch()` calls and creates the mocks.
- **Your UI reacts to the backend** — *The Vault* is `401` (⛔ ACCESS DENIED) until you flip it to `200`.

## Run it

```bash
cd examples/demo-arcade
python3 -m http.server 8000
# open http://localhost:8000
```

Mocktail must be running at `localhost:6625` (default CORS `*` lets this page call it).

## Endpoints it expects

| Endpoint | Response |
| --- | --- |
| `GET /api/scores` | `200` — array of `{ rank, initials, score, game }` |
| `GET /api/vault` | `401` (locked) → flip to `200` with the same shape to reveal |

Example score object:

```json
{ "rank": 1, "initials": "ACE", "score": 999999, "game": "Neon Drift" }
```

## Shot #3 — agent builds the backend (MCP)

With the `mocktail` MCP connected, run your coding agent **in this folder** and prompt:

> Read `index.html` and create Mocktail mocks for every endpoint this app calls. Make
> `GET /api/scores` return 8 arcade high scores with 3-letter initials, big scores, and fun game
> names. Make `GET /api/vault` return **401** for now.

Refresh the page — the leaderboard scans in.

*(No MCP? Tell Mocktail's built-in assistant the same thing.)*

## Shot #4 — the 401 → 200 flip

The Vault shows **⛔ ACCESS DENIED**. Unlock it live:

- In the dashboard, open `GET /api/vault`, change status **401 → 200**, give it a few secret scores,
  save — **or** tell the assistant *"unlock the vault with 3 secret high scores."*
- Hit **↻ REFRESH** — the hidden scores light up.

## Bonus shot — the backend toggle ("build before the backend")

The header has a **BACKEND: REAL API / MOCKTAIL** switch. Flip it on camera:

- **REAL API** → `http://localhost:3000` (not running yet) → `✖ NO SIGNAL`.
- **MOCKTAIL** → `http://localhost:6625/mocktail` → the board lights up.

One toggle, broken → working, by swapping the base URL. Your app doesn't care what serves it.

Insert coin. 🪙
