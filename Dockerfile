# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
# openssl: required by the Prisma engines.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Build: compile a self-contained Next.js server (output: "standalone") ----
FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Prisma CLI only, pinned to the lockfile version, for `migrate deploy` at start-up ----
FROM base AS prisma-cli
COPY package-lock.json ./
RUN version=$(node -p "require('./package-lock.json').packages['node_modules/prisma'].version") \
 && mkdir /opt/prisma-cli && cd /opt/prisma-cli \
 && npm init -y >/dev/null \
 && npm install --no-audit --no-fund "prisma@${version}" \
 && npm cache clean --force

# ---- Runtime ----
FROM base AS runtime
# sqlite3: for online backups from inside the container (docs/DOCKER.md).
RUN apt-get update \
 && apt-get install -y --no-install-recommends sqlite3 \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=file:/app/data/emp.db \
    BIND_HOST=0.0.0.0 \
    PORT=3000 \
    PATH=/opt/prisma-cli/node_modules/.bin:$PATH

COPY --from=prisma-cli /opt/prisma-cli /opt/prisma-cli
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY prisma ./prisma
COPY scripts ./scripts
COPY docker/entrypoint.sh ./docker/entrypoint.sh

# App files stay root-owned (read-only to the app user); only the data volume is writable.
# The SQLite database lives on a volume. Create the mount point owned by the app user so a
# new named volume inherits that ownership; secure-db.mjs then restricts it to 700/600.
RUN mkdir -p /app/data && chown node:node /app/data && chmod 700 /app/data
VOLUME ["/app/data"]

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker/entrypoint.sh"]
