/** Short lead-in shown above the grouped help (Settings → Help). */
export const FAQ_INTRO = {
  lead: 'Mocktail spins up fake HTTP endpoints in seconds — pick a path and a JSON response, then call it like a real API.',
  features: ['Randomized data', 'Response delays', 'Custom status codes', 'Live traffic'],
  assistant:
    'Or skip the clicks: open the Assistant and just ask — “make a GET /users that returns 3 random users” — and it builds, edits, and deletes mocks for you.',
}

/** Grouped help content shown in Settings → Help. Kept out of the assistant panel, which
 *  carries only a few assistant-specific tricks. */
export const FAQ: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: 'Calling your mocks',
    items: [
      {
        q: 'How do I call my mocks?',
        a: 'A mock’s URL is your server address + /mocktail + the path you gave it. So GET /api/users is reachable at http://localhost:6625/mocktail/api/users — use your actual port, shown in the status pill (top-left). Point your app, curl, or Postman at that URL. Tip: the Preview tab has a Copy URL button for the selected mock.',
      },
      {
        q: 'What is the Live view?',
        a: 'The ◉ Live button (top bar, or ⌘L) streams the real requests hitting your mocks — method, status, latency, and response — newest first.',
      },
    ],
  },
  {
    group: 'Building mocks',
    items: [
      {
        q: 'How do I create a mock?',
        a: 'Click + New mock (top right, or ⌘E), set the method and path, and edit the JSON response. Save, and it’s live immediately at its /mocktail/ URL — no restart. You can also let the Assistant create it for you from a plain-language description.',
      },
      {
        q: 'How does randomize work?',
        a: 'Open a mock, click a field in the JSON body, then use the Data tab to pick a generator (uuid, email, number…). By default a generated field gets a fresh value on every request. To lock one, turn off its “Regenerate on every request” toggle — the value is then generated once, frozen at save, and returned unchanged on every call. Mix both in one response: e.g. a frozen id with a per-request random email.',
      },
      {
        q: 'How do response delays work?',
        a: 'Each mock can wait 0–30000ms before responding, to simulate latency. Set it with the Delay slider in the editor’s request bar.',
      },
      {
        q: 'How do I set a custom status code?',
        a: 'In the editor’s request bar use the Status dropdown — pick a common code or type any value.',
      },
    ],
  },
  {
    group: 'Managing mocks',
    items: [
      {
        q: 'How do I run, duplicate, or delete a mock?',
        a: 'Right-click a row for Open / Run / Copy path / Duplicate / Delete. Or use the keyboard: ⌘↵ run · ⌘D duplicate · ⌘E new · ↵ open · ↑↓ navigate.',
      },
      {
        q: 'How do I import mocks?',
        a: 'Settings → Import: paste an exported JSON array (or { "Apis": [...] }) or choose a file. Existing paths are skipped, not overwritten.',
      },
      {
        q: 'How do I export mocks?',
        a: 'Click the download icon next to the ⌘F search in the catalog header — it saves the listed mocks as a timestamped JSON file. If a search is active, only matching mocks are exported (hover the icon for the count). The file re-imports via Settings → Import.',
      },
    ],
  },
  {
    group: 'Assistant',
    items: [
      {
        q: 'What can the Assistant do?',
        a: 'Two things. It answers questions about Mocktail and about your own mocks — it looks up your endpoints and their responses on request (it doesn’t read them until you ask). And once you add an API key, it can act — create, update, and delete mock endpoints from plain language (e.g. “make a GET /users that returns 3 random users”). The catalog updates live as it works, the same way the MCP server does — just in-app.',
      },
      {
        q: 'Where is my AI provider key stored?',
        a: 'On your machine, never in the browser. On desktop/CLI it goes in the OS keychain (macOS Keychain, Windows Credential Manager, or Linux Secret Service); on headless Linux, a 0600 file in the app-data dir. In containers, set MOCKTAIL_AI_API_KEY_ANTHROPIC instead (per provider; the generic MOCKTAIL_AI_API_KEY still works as a deprecated fallback). All AI calls are made server-side — the dashboard only ever sees a masked hint like sk-…1234. Manage it in Settings → API keys.',
      },
    ],
  },
  {
    group: 'Deployment',
    items: [
      {
        q: 'How do I protect my mocks with a key?',
        a: 'Off by default — served mocks are open. Mainly useful for containerized deployments: set the MOCKTAIL_API_KEY env var and every request to /mocktail/* must then send a matching X-API-Key header.',
      },
    ],
  },
]
