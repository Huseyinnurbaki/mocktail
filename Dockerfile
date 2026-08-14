FROM node:20-alpine AS builder-ui

WORKDIR /src

# Copy dependency manifests first for better layer caching
COPY ./mocktail-ui/package.json ./mocktail-ui/yarn.lock ./
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile --network-timeout 600000

# Copy source and build (Vite → ./build)
COPY ./mocktail-ui .
RUN yarn build

FROM golang:1.26-alpine AS builder-api

WORKDIR /src
COPY ./mocktail-api .
RUN go mod download

# Stage the built dashboard where go:embed expects it, then build — the UI is baked into the
# binary (no separate ./build at runtime).
COPY --from=builder-ui /src/build ./build
# Pure Go (ncruces/go-sqlite3 via WASM) — no C toolchain, no static-link dance.
# -s -w strips debug symbols/DWARF (~12 MB smaller binary; no downside for a server).
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app .

FROM scratch

COPY --from=builder-api /app /app
EXPOSE 6625

# Keep the DB at /db (mounted as a volume in docker-compose) — scratch has no HOME, so the
# app-data default can't resolve here; this pins it explicitly and preserves existing volumes.
ENV MOCKTAIL_DB_PATH=/db/apis.db

ENTRYPOINT ["/app"]
