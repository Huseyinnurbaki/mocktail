FROM golang:1.26-alpine AS builder-api

WORKDIR /src
COPY ./mocktail-api .
RUN go mod download
# Pure Go (ncruces/go-sqlite3 via WASM) — no C toolchain, no static-link dance.
RUN CGO_ENABLED=0 GOOS=linux go build -o /app .

FROM node:20-alpine AS builder-dashboard

WORKDIR /src

# Copy dependency files first (better layer caching)
COPY ./mocktail-dashboard/package.json ./mocktail-dashboard/yarn.lock ./

# Install dependencies with longer timeout and retry logic
# This layer is cached if package.json/yarn.lock don't change
RUN --mount=type=cache,target=/root/.yarn \
    yarn config set network-timeout 600000 && \
    (yarn install --frozen-lockfile --network-timeout 600000 || \
     yarn install --frozen-lockfile --network-timeout 600000 || \
     yarn install --frozen-lockfile --network-timeout 600000)

# Copy source files
COPY ./mocktail-dashboard .

# Build application
RUN export NODE_OPTIONS=--openssl-legacy-provider && \
    yarn build

FROM scratch

COPY --from=builder-api /app /app
COPY --from=builder-dashboard /src/build /build
EXPOSE 6625

# Keep the DB at /db (mounted as a volume in docker-compose) — scratch has no HOME, so the
# app-data default can't resolve here; this pins it explicitly and preserves existing volumes.
ENV MOCKTAIL_DB_PATH=/db/apis.db

ENTRYPOINT ["/app"]
