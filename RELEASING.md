# Releasing

Tagging `vX.Y.Z` is the trigger for most things. A couple of steps are manual **on purpose**.

## Automated on tag push (`git push origin vX.Y.Z`)
- **`release.yml`** → GoReleaser: cross-platform binaries, the GitHub release, and the Homebrew cask
  in `homebrew-tap`.
- **`docker-onpublish.yml`** → `hhaluk/mocktail:X.Y.Z` (and `:latest` for stable tags only).
- **`npm-onpublish.yml`** → `mocktail-mcp@X.Y.Z` (`latest` for stable, `next` for `-rc.*`).

Pre-releases (`vX.Y.Z-rc.N`) publish their own version tags but **never** move `:latest` or npm `latest`.

## Manual — STABLE releases only
The landing site is deployed **by hand** so pre-releases never affect getmocktail.com or its SEO:

1. Bump **`landing/version.json`** — `version` + `highlights` (highlights feed the in-app
   "update available" tooltip in Settings).
2. Run **`./landing/deploy.sh`** — injects `softwareVersion` into the JSON-LD from `version.json`,
   then deploys to Cloudflare Pages.
3. Only if the tagline/brand changed: re-render `landing/og.png` and update the GitHub
   **Settings → Social preview** image.
