#!/bin/sh
set -eu

: "${PEOPLE_REMOTE_URL:=http://localhost:8081/remoteEntry.js}"
: "${DELIVERY_REMOTE_URL:=http://localhost:8082/remoteEntry.js}"

export PEOPLE_REMOTE_URL DELIVERY_REMOTE_URL

envsubst '${PEOPLE_REMOTE_URL} ${DELIVERY_REMOTE_URL}' \
  < /etc/bps/config.js.template \
  > /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
