# ─── Stage 1 : Builder (compilation TypeScript & génération Prisma) ────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Configurer npm pour gérer les retries réseau si nécessaire
RUN npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-retries 3 \
 && npm config set fetch-timeout 300000

# 1. Installer toutes les dépendances (Layer mis en cache si package*.json ne change pas)
COPY package*.json ./
RUN npm ci

# 2. Copier le schéma Prisma et générer le client (Layer mis en cache si schema.prisma ne change pas)
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copier le code source et compiler l'application NestJS
COPY . .
RUN npm run build

# 4. Éliminer les devDependencies pour réduire la taille des node_modules
RUN npm prune --omit=dev

# ─── Stage 2 : Production (image minimale & ultra-rapide à construire) ────────
FROM node:22-alpine AS production

WORKDIR /app

# Copier uniquement les éléments compilés et nettoyés depuis le stage builder
# Aucun RUN npm ci dans ce stage : gain massif de temps de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Créer le répertoire d'uploads avec les bons droits
RUN mkdir -p uploads && chown -R node:node uploads

EXPOSE 3006

CMD ["node", "dist/src/main"]
