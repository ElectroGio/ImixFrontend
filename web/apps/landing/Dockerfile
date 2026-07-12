# syntax=docker/dockerfile:1.7
# Build context: frontend/web  (needs pnpm-workspace.yaml + pnpm-lock.yaml)

ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/landing/package.json apps/landing/package.json
RUN pnpm install --frozen-lockfile --filter @imix/landing...

FROM node:${NODE_VERSION} AS build
WORKDIR /repo
RUN corepack enable
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/landing/node_modules ./apps/landing/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/landing ./apps/landing
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm --filter @imix/landing build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/apps/landing/dist /usr/share/nginx/html
# nginx alpine auto-runs envsubst on templates/*.template -> /etc/nginx/conf.d/
COPY apps/landing/nginx.conf.template /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://api:8080
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
