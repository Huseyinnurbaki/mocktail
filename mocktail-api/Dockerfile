FROM golang:1.17 AS builder

WORKDIR /src
COPY . .
RUN go mod download
RUN CGO_ENABLED=1 GOOS=linux go build -o /app -a -ldflags '-linkmode external -extldflags "-static"' .
RUN mkdir /db

FROM scratch
COPY --from=builder /app /app
COPY --from=builder /db /db
COPY --from=builder /src/build /build
EXPOSE 4000

ENTRYPOINT ["/app"]
