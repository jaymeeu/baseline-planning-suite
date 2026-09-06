# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/shell/package.json apps/shell/
COPY apps/people/package.json apps/people/
COPY apps/delivery/package.json apps/delivery/
COPY packages/domain/package.json packages/domain/
COPY packages/contracts/package.json packages/contracts/
COPY packages/data/package.json packages/data/
COPY packages/ui/package.json packages/ui/
COPY tsconfig.base.json ./

RUN npm install

COPY packages packages
COPY seeder seeder
COPY apps/shell apps/shell
COPY apps/people apps/people
COPY apps/delivery apps/delivery

# Remote URLs are injected at container start via /config.js (not at image build).
RUN npm run build -w @bps/shell

FROM nginx:1.27-alpine AS runtime
RUN apk add --no-cache gettext

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/shell/dist /usr/share/nginx/html
COPY apps/shell/docker/config.js.template /etc/bps/config.js.template
COPY apps/shell/docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PEOPLE_REMOTE_URL=http://localhost:8081/remoteEntry.js \
    DELIVERY_REMOTE_URL=http://localhost:8082/remoteEntry.js

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
