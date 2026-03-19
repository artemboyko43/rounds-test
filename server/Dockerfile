FROM node:20-slim AS base

WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm run prisma:generate

FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

RUN npx playwright install --with-deps chromium

RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nodejs

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

RUN mkdir -p storage/screenshots && chown -R nodejs:nodejs storage

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown nodejs:nodejs docker-entrypoint.sh

# Run as root so Prisma can write engine binaries during migrations.
USER root

EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
