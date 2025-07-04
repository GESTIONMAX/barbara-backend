FROM node:18-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installation des dépendances
RUN npm ci

# Copie du code source
COPY . .

# Génération des clients Prisma
RUN npx prisma generate

# Build de l'application
RUN npm run build

# Étape de production
FROM node:18-alpine AS production

WORKDIR /app

# Copie des fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Configuration des variables d'environnement
ENV NODE_ENV=production

# Exposition du port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
