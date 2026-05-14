ARG NODE_VERSION=22-bookworm-slim

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc tsconfig.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
RUN pnpm build

FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod

FROM node:${NODE_VERSION} AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --system --no-create-home --shell /usr/sbin/nologin app

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json newrelic.js ./

USER app

ENV NODE_ENV=production \
    APP_PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -fsS http://localhost:8080/ping || exit 1

CMD ["node", "-r", "newrelic", "dist/main.js"]
