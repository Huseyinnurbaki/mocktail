FROM golang:1.24-alpine AS builder-api

WORKDIR /src
COPY ./mocktail-api .
RUN go mod download
RUN CGO_ENABLED=1 GOOS=linux go build -o /app -a -ldflags '-linkmode external -extldflags "-static"' .

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
EXPOSE 4000

ENTRYPOINT ["/app"]
