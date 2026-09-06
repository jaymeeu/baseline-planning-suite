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
COPY apps/delivery apps/delivery
COPY tsconfig.base.json ./

RUN npm run build -w @bps/delivery

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/delivery/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
