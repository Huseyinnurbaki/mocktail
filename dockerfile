FROM node:lts-slim

# Create app directory
WORKDIR /

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 7084


# Installing supervisor service and creating directories for copy supervisor configurations
RUN apt-get -y update
RUN apt-get -y install supervisor && mkdir -p /var/log/supervisor && mkdir -p /etc/supervisor/conf.d
ADD supervisor.conf /etc/supervisor.conf 
COPY snode snode
COPY sreact sreact
CMD ["supervisord", "-c", "/etc/supervisor.conf"]
