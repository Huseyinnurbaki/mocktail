FROM golang:1.26-alpine AS builder-api

WORKDIR /src
COPY ./mocktail-api .
RUN go mod download
# Pure Go (ncruces/go-sqlite3 via WASM) — no C toolchain, no static-link dance.
RUN CGO_ENABLED=0 GOOS=linux go build -o /app .

FROM node:20-alpine AS builder-ui

WORKDIR /src

# Copy dependency manifests first for better layer caching
COPY ./mocktail-ui/package.json ./mocktail-ui/yarn.lock ./
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile --network-timeout 600000

# Copy source and build (Vite → ./build)
COPY ./mocktail-ui .
RUN yarn build

FROM scratch

COPY --from=builder-api /app /app
COPY --from=builder-ui /src/build /build
EXPOSE 6625

# Keep the DB at /db (mounted as a volume in docker-compose) — scratch has no HOME, so the
# app-data default can't resolve here; this pins it explicitly and preserves existing volumes.
ENV MOCKTAIL_DB_PATH=/db/apis.db

ENTRYPOINT ["/app"]
