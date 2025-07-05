#!/bin/sh

# Arrête le script immédiatement si une commande échoue. C'est une sécurité essentielle.
set -e

echo "=== DÉMARRAGE DE BARBARA BACKEND ==="
echo "Vérification des variables d'environnement..."

# Étape 1: Appliquer les migrations de la base de données.
# C'est l'étape la plus importante avant de démarrer.
# Elle garantit que le schéma de votre base de données correspond au code de l'application.
echo "Application des migrations Prisma..."
npx prisma migrate deploy

echo "✅ Migrations appliquées avec succès."

# Étape 2: Démarrer l'application principale.
# On utilise 'exec' pour que le processus Node.js remplace le shell.
# Cela permet à l'application de recevoir correctement les signaux d'arrêt de Docker.
echo "Démarrage de l'application sur le point d'entrée: dist/app.js"
exec node dist/app.js
