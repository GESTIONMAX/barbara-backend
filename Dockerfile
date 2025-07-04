FROM node:18-alpine AS builder
WORKDIR /app

# Installation des dépendances système pour Prisma
RUN apk add --no-cache openssl

# Copie des fichiers de dépendances
COPY package*.json ./

# Modification du package.json pour supprimer le script husky
RUN sed -i '/{\s*"prepare":\s*"husky install"/d' package.json

# Copie de tous les fichiers source d'abord
COPY . .

# Installation des dépendances
RUN npm install

# Génération des clients Prisma
RUN npx prisma generate

# Build de l'application
RUN npm run build

# Étape de production
FROM node:18-alpine AS production
WORKDIR /app

# Installation des dépendances système pour Prisma et health check
RUN apk add --no-cache openssl wget

# Copie des fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Configuration des variables d'environnement
ENV NODE_ENV=production

# Exposition du port
EXPOSE 3000

# Configuration du health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Copie du script de démarrage
COPY start.sh ./
RUN chmod +x start.sh

# Commande de démarrage
CMD ["/bin/sh", "./start.sh"]
