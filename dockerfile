FROM node:lts-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 7080

CMD [ "node", "server.js" ]

# later https://github.com/Unitech/pm2