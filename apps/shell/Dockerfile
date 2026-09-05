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
COPY tsconfig.base.json ./

RUN npm install

COPY packages packages
COPY fixtures fixtures
COPY apps/shell apps/shell
COPY apps/people apps/people
COPY apps/delivery apps/delivery

ARG PEOPLE_REMOTE_URL=http://localhost:8081/remoteEntry.js
ARG DELIVERY_REMOTE_URL=http://localhost:8082/remoteEntry.js
ENV PEOPLE_REMOTE_URL=$PEOPLE_REMOTE_URL
ENV DELIVERY_REMOTE_URL=$DELIVERY_REMOTE_URL

RUN npm run build -w @bps/shell

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/shell/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
