#
# Anvil Connect Dockerfile
#
# https://github.com/anvilresearch/connect
#

FROM mhart/alpine-iojs:3.1.0

# Install npm package build dependencies
RUN apk add --update python make alpine-sdk && \
    rm /var/cache/apk/*

# Define working dir
WORKDIR /opt/connect

# Copy files
COPY ./package.json /opt/connect/package.json
COPY ./server.js /opt/connect/server.js

# Install npm dependencies
RUN npm install --production

# Define mountable directories
VOLUME [ "/opt/connect/config", "/opt/connect/email", "/opt/connect/protocols", "/opt/connect/providers", "/opt/connect/public", "/opt/connect/views" ]

# Define environment variables
ENV NODE_ENV production

# Define default command
CMD ["node", "server.js"]
