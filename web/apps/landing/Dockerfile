# syntax=docker/dockerfile:1.7
# Build context: frontend/web  (pnpm workspace root — needs pnpm-workspace.yaml + pnpm-lock.yaml)

ARG NODE_VERSION=20-alpine
ARG PNPM_VERSION=9.15.0

# ---------- deps ----------
FROM node:${NODE_VERSION} AS deps
ARG PNPM_VERSION
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# Copy every workspace manifest — required by --frozen-lockfile.
COPY apps/admin/package.json  ./apps/admin/package.json
COPY apps/landing/package.json ./apps/landing/package.json

RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM node:${NODE_VERSION} AS build
ARG PNPM_VERSION
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/landing/node_modules ./apps/landing/node_modules

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/landing ./apps/landing

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm --filter @imix/landing build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/apps/landing/dist /usr/share/nginx/html
COPY apps/landing/nginx.conf.template /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://api:8080
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
