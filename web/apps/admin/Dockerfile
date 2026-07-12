# syntax=docker/dockerfile:1.7
# Build context: frontend/web  (pnpm workspace root — needs pnpm-workspace.yaml + pnpm-lock.yaml)

ARG NODE_VERSION=20-alpine
ARG PNPM_VERSION=9.15.0

# ---------- deps: install ALL workspace deps once (cache-friendly) ----------
FROM node:${NODE_VERSION} AS deps
ARG PNPM_VERSION
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Copy workspace root files first for maximum layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# --frozen-lockfile requires EVERY workspace package referenced in the lockfile
# to be present on disk, so copy every app manifest before installing.
COPY apps/admin/package.json  ./apps/admin/package.json
COPY apps/landing/package.json ./apps/landing/package.json

RUN pnpm install --frozen-lockfile

# ---------- build: bring in sources and produce dist ----------
FROM node:${NODE_VERSION} AS build
ARG PNPM_VERSION
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/admin/node_modules ./apps/admin/node_modules

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/admin ./apps/admin

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm --filter @imix/admin build

# ---------- runtime: nginx serving the static SPA ----------
FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/apps/admin/dist /usr/share/nginx/html
# nginx:alpine runs envsubst over /etc/nginx/templates/*.template on startup
COPY apps/admin/nginx.conf.template /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://api:8080
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
