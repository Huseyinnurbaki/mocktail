# 🍸 Demo — The Mocktail Bar

A tiny neon "speakeasy menu" app whose backend **is Mocktail**. It shows off two things on camera:

- **MCP / AI builds the backend** — point a coding agent at this app; it reads the `fetch()` calls and
  creates the mocks.
- **Your UI reacts to the backend** — the *Secret Menu* is `401` (locked) until you flip it to `200`.

## Run it

Serve the folder (so the browser can `fetch` your local Mocktail):

```bash
cd examples/demo-mocktail-bar
python3 -m http.server 8000
# open http://localhost:8000
```

Make sure Mocktail is running (`mocktail` or the Docker image) at `localhost:6625`. Mocktail's default
CORS (`*`) lets this page call it.

## Endpoints it expects

| Endpoint | Response |
| --- | --- |
| `GET /api/cocktails` | `200` — array of `{ name, tagline, garnish, colorFrom, colorTo, abv }` |
| `GET /api/menu/secret` | `401` (locked) → flip to `200` with the same shape to unlock |

Example cocktail object:

```json
{ "name": "Sunset Fizz", "tagline": "Grapefruit, rosemary, soda.", "garnish": "🌅",
  "colorFrom": "#ff8a4c", "colorTo": "#ff2d78", "abv": 0 }
```

## Shot #3 — agent builds the backend (MCP)

With the `mocktail` MCP connected, run your coding agent **in this folder** and prompt:

> Read `index.html` and create Mocktail mocks for every endpoint this app calls. Make
> `GET /api/cocktails` return 6 fun zero-proof cocktails with realistic names, taglines, a garnish
> emoji, `colorFrom`/`colorTo` hex, and `abv: 0`. Make `GET /api/menu/secret` return **401** for now.

Watch the mocks appear in the dashboard, then refresh the page — the house menu pours in.

*(No MCP? Just tell Mocktail's built-in assistant the same thing.)*

## Shot #4 — the 401 → 200 flip

The Secret Menu shows **🔒 Members only**. Unlock it live:

- In the dashboard, open `GET /api/menu/secret`, change status **401 → 200**, give it a few secret
  cocktails as the response, save — **or** tell the assistant *"unlock the secret menu with 3 secret
  cocktails."*
- Hit **↻ Refresh** — the secret cards shimmer in.

That's the story: the agent built the backend, and the UI does whatever the backend says.

## Bonus shot — the backend toggle ("build before the backend")

The header has a **Backend: Real API / Mocktail** switch. Flip it on camera:

- **Real API** points at `http://localhost:3000` — the backend you haven't built yet, so the page
  errors out (no bartender).
- **Mocktail** points at `http://localhost:6625/mocktail` — and the menu pours right in.

One toggle, from broken to working, by swapping the base URL. That's the whole pitch: your app doesn't
care what serves it — point it at Mocktail and keep building.
