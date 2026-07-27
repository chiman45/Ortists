# syntax=docker/dockerfile:1

# ── Dependencies ─────────────────────────────────────────────
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# ── Builder ──────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are inlined at build time — pass as ARGs to override
ARG NEXT_PUBLIC_SUPABASE_URL=https://aklpjtcsrjxfruzkgzne.supabase.co
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_HCOa7pC7qO-ByE9sjWeJiw_SKFHlAtC
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Zmx5aW5nLWNob3ctNDcuY2xlcmsuYWNjb3VudHMuZGV2JA
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/feed
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL \
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL \
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL \
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ── Runner ───────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
