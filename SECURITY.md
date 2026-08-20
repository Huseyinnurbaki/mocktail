# Security Policy

## Supported Versions

Security fixes are provided for the latest release. Please upgrade to the newest version before reporting an issue.

| Version | Supported |
| ------- | --------- |
| 4.0.x   | ✅        |
| < 4.0   | ❌        |

## Reporting a Vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report vulnerabilities privately through either:

- **Email** — [security@getmocktail.com](mailto:security@getmocktail.com)
- **GitHub** — [Report a vulnerability](https://github.com/Huseyinnurbaki/mocktail/security/advisories/new)  
  (repo → **Security** → **Advisories** → *Report a vulnerability*)

Please keep vulnerability details confidential while we investigate and coordinate a fix.

When reporting an issue, please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce it, including a minimal proof-of-concept if possible
- The affected version(s)
- How you're running Mocktail (binary, Docker, or source)

### What to Expect

- We aim to acknowledge reports within a few days.
- We'll investigate and confirm the issue and keep you updated on remediation.
- Once a fix is available, we'll publish a patched release and coordinate disclosure.
- We're happy to credit reporters in the advisory if they'd like.

## Scope & Notes

Mocktail is a **self-hosted developer tool** that runs on your own machine or infrastructure.

Some behaviors are intentional or depend on deployment configuration:

- **The dashboard and management API (`/core/v1/*`) are open by default.** Set `MOCKTAIL_ADMIN_KEY` to protect management endpoints, and `MOCKTAIL_API_KEY` to require authentication for served mocks (`/mocktail/*`). Simply exposing an instance without authentication to an untrusted network is not, by itself, considered a vulnerability.
- **AI provider keys** are stored server-side only — in the OS keychain on desktop or via an environment variable in containers — and are never returned to the browser. Setting a key is restricted to local (loopback) sessions. Keys are never embedded in the binary.
- **Mock responses are user-defined content** and are served as configured. Mocktail does not sanitize user-provided mock response JSON.


Please only test Mocktail instances that you own or have explicit permission to test.