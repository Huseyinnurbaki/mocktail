FROM node:lts-slim AS builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY . .

RUN npm build && \
    rm -rf node_modules && \
    npm ci --only=production
# Bundle app source



FROM alpine:latest

RUN apk update && \
    apk upgrade && \
    apk add nodejs && \
    mkdir -p /usr/src/app
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY --from=builder /usr/src/app /usr/src/app

EXPOSE 7080
CMD [ "node", "server.js" ]

# later https://github.com/Unitech/pm2