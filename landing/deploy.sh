#!/usr/bin/env bash
# Deploy the landing site to Cloudflare Pages.
#
# Injects "softwareVersion" into the SoftwareApplication JSON-LD from version.json — the single
# source of truth you already bump each release — so structured data always matches the shipped
# version without a hardcoded copy in index.html (which would go stale).
#
# Usage:  ./landing/deploy.sh          (run from anywhere; cd's to its own dir)
set -euo pipefail
cd "$(dirname "$0")"

VER="$(node -p "require('./version.json').version")"
BUILD=".build"

rm -rf "$BUILD"
rsync -a --exclude "$BUILD" --exclude ".wrangler" --exclude "deploy.sh" ./ "$BUILD"/

# Insert "softwareVersion" right after "downloadUrl" in the JSON-LD (no-op if already present).
python3 - "$BUILD/index.html" "$VER" <<'PY'
import sys
path, ver = sys.argv[1], sys.argv[2]
s = open(path).read()
anchor = '"downloadUrl": "https://getmocktail.com/#install",'
if '"softwareVersion"' not in s and anchor in s:
    s = s.replace(anchor, anchor + '\n  "softwareVersion": "%s",' % ver, 1)
open(path, "w").write(s)
PY

echo "→ Deploying landing @ v$VER (Cloudflare Pages: mocktail)"
wrangler pages deploy "$BUILD" --project-name mocktail
rm -rf "$BUILD"
