#
# Anvil Connect Dockerfile
#
# https://github.com/anvilresearch/connect
#

FROM mhart/alpine-node:4.2.4

# Define working dir
WORKDIR /opt/connect

# Copy files
COPY ./package.json /opt/connect/package.json
COPY ./server.js /opt/connect/server.js

# Install npm package
RUN apk add --update python make alpine-sdk openssl && \
    npm install --production && \
    apk del python make alpine-sdk && \
    rm /var/cache/apk/* && \
    rm -rf /root/.npm /root/.node-gyp && \
    rm -rf /usr/lib/node_modules && \
    rm -rf /tmp/*

# Define mountable directories
VOLUME [ "/opt/connect/config", "/opt/connect/keys", "/opt/connect/email", "/opt/connect/logs", "/opt/connect/protocols", "/opt/connect/providers", "/opt/connect/public", "/opt/connect/views" ]

# Define environment variables
ENV NODE_ENV production

# Define default command
CMD ["node", "server.js"]
