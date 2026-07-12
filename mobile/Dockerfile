# syntax=docker/dockerfile:1.7
# Build context: frontend/mobile
#
# NOTE: Expo/React Native apps are primarily for iOS/Android. To deploy on Dokploy
# we build the web target (`expo export --platform web`) and serve the static
# bundle with Nginx. If some native-only modules (e.g. expo-secure-store) are
# imported unconditionally you may need platform-specific files (`file.web.ts`)
# or dynamic imports guarded by `Platform.OS`.

ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS build
WORKDIR /app
RUN corepack enable && apk add --no-cache bash
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG EXPO_PUBLIC_API_BASE_URL=/api
ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}
# Bake the API base URL into the web bundle via extras.apiBaseUrl.
# app.config.js can override app.json to read from process.env at build time.
RUN pnpm exec expo export --platform web --output-dir dist

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://api:8080
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
