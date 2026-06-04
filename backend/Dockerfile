# ─── Stage 1 : Builder (compile TypeScript) ────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Configurer npm pour gérer les timeouts réseau sur VPS (retry 3x, timeout 5 min)
RUN npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-retries 3 \
 && npm config set fetch-timeout 300000

# Installer toutes les dépendances (y compris devDependencies pour compiler)
COPY package*.json ./
RUN npm ci

# Générer le client Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Copier le code source et compiler NestJS
COPY . .
RUN npm run build

# ─── Stage 2 : Production (image légère) ──────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Configurer npm pour les timeouts réseau
RUN npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-retries 3 \
 && npm config set fetch-timeout 300000

# Installer uniquement les dépendances de production
COPY package*.json ./
RUN npm ci --omit=dev

# Récupérer le client Prisma et le build depuis le stage builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Créer le répertoire d'uploads avec les bons droits
RUN mkdir -p uploads && chown -R node:node uploads

EXPOSE 3006

CMD ["node", "dist/src/main"]
