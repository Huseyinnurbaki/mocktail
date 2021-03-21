FROM node:14 AS builder

WORKDIR /app
ADD . ./

RUN npm build && \
    rm -rf node_modules && \
    npm ci --only=production


FROM alpine:latest

RUN apk update && \
    apk upgrade && \
    apk add nodejs

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app

EXPOSE 7080
CMD [ "node", "server.js" ]
