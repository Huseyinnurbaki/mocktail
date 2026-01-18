FROM golang:1.23 AS builder-api

WORKDIR /src
COPY ./mocktail-api .
RUN go mod download
RUN CGO_ENABLED=1 GOOS=linux go build -o /app -a -ldflags '-linkmode external -extldflags "-static"' .

FROM node:lts-slim AS builder-dashboard

WORKDIR /src
COPY ./mocktail-dashboard .
RUN export NODE_OPTIONS=--openssl-legacy-provider && \
    yarn install --frozen-lockfile && \
    yarn build

FROM scratch

COPY --from=builder-api /app /app
COPY --from=builder-dashboard /src/build /build
EXPOSE 4000

ENTRYPOINT ["/app"]
