FROM golang:1.17 AS builder

WORKDIR /src
COPY . .
RUN go mod download
RUN go build -o /app .

FROM debian:buster-slim
COPY --from=builder /app /app
COPY --from=builder /src/build /build
EXPOSE 4000

ENTRYPOINT ["/app"]
