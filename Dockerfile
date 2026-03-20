# ─── Stage 1: Install production dependencies ─────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install libc6-compat for native modules (e.g. sharp, better-sqlite3)
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ─── Stage 2: Build the application ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Copy production deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Install all deps (including devDependencies needed for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Provide a build-time database so static pre-rendering can run Prisma queries.
# At runtime, DATABASE_URL is overridden by docker-compose to /app/data/vault.db.
ENV DATABASE_URL="file:/tmp/build.db"
RUN npx prisma migrate deploy

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Stage 3: Production runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

# Copy Prisma schema and migrations so we can run migrate deploy at startup.
# Also copy the CLI package directly so we use the project's pinned version
# (5.22.0) instead of npx downloading the latest (which is a breaking Prisma 7).
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma  ./node_modules/prisma

# Create persistent data directories
RUN mkdir -p /app/data /app/uploads

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/vault.db"
ENV IMAGE_UPLOAD_DIR="/app/uploads"
ENV SESSION_COOKIE_SECURE="auto"

# Run migrations then start the server
CMD ["sh", "-c", ". ./scripts/bootstrap-session-secret.sh && node ./node_modules/prisma/build/index.js migrate deploy && node server.js"]
