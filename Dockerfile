# syntax=docker/dockerfile:1

# Next.js 16 (standalone output) + Prisma 7 build for Offscript.
# Stages:
#   deps     -> reproducible dependency install
#   dev      -> hot-reloading dev server (used by the `dev` compose profile)
#   builder  -> production build (.next/standalone)
#   migrator -> one-shot `prisma migrate deploy` runner
#   runner   -> minimal production image (server.js only)

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS base
# libc6-compat + openssl are needed by the Next.js SWC binaries and the
# Prisma schema engine on Alpine (musl).
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------------- deps
FROM base AS deps
# `postinstall` runs `prisma generate`, so the schema and config must be
# present, and prisma.config.ts resolves DATABASE_URL when it is loaded.
# This placeholder is only used for the generate step, never at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
# Installs devDependencies too: the builder needs the Prisma CLI and the
# migrator needs it at runtime. Scripts stay enabled so the platform-specific
# Prisma schema engine for Alpine (musl) is fetched during install.
RUN npm ci

# ---------------------------------------------------------------- dev
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Mount point for the uploads volume used by compose.
RUN mkdir -p uploads
EXPOSE 3000
# Regenerate the client on start so a host-mounted src/ never goes stale.
CMD ["sh", "-c", "npx prisma generate && npm run dev"]

# ---------------------------------------------------------------- builder
FROM base AS builder
ENV NODE_ENV=production
# prisma.config.ts resolves DATABASE_URL when the config is loaded, so a
# placeholder must exist for `prisma generate` during the build. This value is
# never used at runtime and is not present in the runner stage.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV DATABASE_URL=${DATABASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `npm run build` = prisma generate && next build
RUN npm run build

# ---------------------------------------------------------------- migrator
FROM base AS migrator
ENV NODE_ENV=production
# Only the migrations CLI is installed here — the app's dependency tree is not.
# `npx prisma` alone is not enough: prisma.config.ts resolves `prisma/config`
# and `dotenv/config` from the working directory, so the package has to live in
# /app. Installing ~40 MB replaces copying ~1 GB of node_modules.
COPY package.json package-lock.json /tmp/
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN PRISMA_VERSION="$(node -p "require('/tmp/package-lock.json').packages['node_modules/prisma'].version")" \
 && rm -f /tmp/package.json /tmp/package-lock.json \
 && npm init -y >/dev/null \
 && npm install --no-save --no-audit --no-fund --cache /tmp/npm-cache "prisma@${PRISMA_VERSION}" \
 && rm -rf /tmp/npm-cache
# DATABASE_URL is supplied by compose at run time.
CMD ["npx", "prisma", "migrate", "deploy"]

# ---------------------------------------------------------------- runner
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs
# Static assets and public files are not included in the standalone trace.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Mount point for the uploads volume; must be writable by the runtime user.
RUN mkdir -p uploads && chown 1001:1001 uploads
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
