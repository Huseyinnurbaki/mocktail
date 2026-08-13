/** Grouped help content shown in Settings → Help. Kept out of the assistant panel, which
 *  carries only a few assistant-specific tricks. */
export const FAQ: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: 'Assistant',
    items: [
      {
        q: 'What can the assistant do?',
        a: 'Two things. It answers questions about Mocktail and about your own mocks — it looks up your endpoints and their responses on request (it doesn’t read them until you ask). And once you add an API key, it can act — create, update, and delete mock endpoints from plain language (e.g. “make a GET /users that returns 3 random users”). The catalog updates live as it works, the same way the MCP server does — just in-app.',
      },
      {
        q: 'Where is my AI provider key stored?',
        a: 'On your machine, never in the browser. On desktop/CLI it goes in the OS keychain (macOS Keychain, Windows Credential Manager, or Linux Secret Service); on headless Linux, a 0600 file in the app-data dir. In containers, set MOCKTAIL_AI_API_KEY instead. All AI calls are made server-side — the dashboard only ever sees a masked hint like sk-…1234. Manage it in Settings → API keys.',
      },
    ],
  },
  {
    group: 'Building mocks',
    items: [
      {
        q: 'How does randomize work?',
        a: 'Open a mock, click a field in the JSON body, then use the Data tab to pick a generator (uuid, email, number…). Values regenerate on every request unless you turn that off (frozen at save).',
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
    group: 'Server & traffic',
    items: [
      {
        q: 'What is the Live view?',
        a: 'The ◉ Live button (top bar, or ⌘L) streams the real requests hitting your mocks — method, status, latency, and response — newest first.',
      },
      {
        q: 'How do I protect my mocks with a key?',
        a: 'Set the MOCKTAIL_API_KEY env var; then requests to /mocktail/* must include an X-API-Key header.',
      },
    ],
  },
]
