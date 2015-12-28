#
# Redis Dockerfile
#
# https://github.com/anvilresearch/redis
#

FROM alpine:3.2

# Version
ENV REDIS_VERSION 3.0.5
ENV REDIS_VERSION_RELEASE -r0

# Install redis
RUN apk update && \
    apk add --update redis=${REDIS_VERSION}${REDIS_VERSION_RELEASE} && \
    rm -rf /var/cache/apk/* && \
    mkdir /data && \
    chown -R redis:redis /data

# Add configuration
COPY etc /etc/

# Define mountable directories
VOLUME ["/data", "/logs"]

# Define working directory
WORKDIR /data

# Define default command
CMD [ "redis-server", "/etc/redis.conf" ]
