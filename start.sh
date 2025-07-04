#!/bin/sh
echo "=== DÉMARRAGE DE BARBARA BACKEND ==="
echo "Vérification des variables d'environnement essentielles :"
echo "DATABASE_URL: ${DATABASE_URL:0:15}... (tronqué pour sécurité)"
echo "NODE_ENV: $NODE_ENV"
echo "JWT_SECRET: ${JWT_SECRET:0:3}... (tronqué pour sécurité)"
echo "FRONTEND_URL: $FRONTEND_URL"
echo "PORT: $PORT"

# Corriger la variable DATABASE_URL si elle commence par DATABASE_URL=
if [[ "$DATABASE_URL" == DATABASE_URL=* ]]; then
    echo "⚠️ DATABASE_URL mal formatée, application de correctif..."
    # Extraire la vraie valeur en supprimant le préfixe DATABASE_URL=
    FIXED_URL=$(echo "$DATABASE_URL" | sed 's/^DATABASE_URL=//')
    # Supprimer les guillemets d'échappement si présents
    FIXED_URL=$(echo "$FIXED_URL" | sed 's/^\\"//;s/\\"$//')
    # Exporter la variable corrigée
    export DATABASE_URL="$FIXED_URL"
    echo "✅ DATABASE_URL corrigée: ${DATABASE_URL:0:15}... (tronqué pour sécurité)"
fi

# Exporter explicitement la variable dans le format attendu par Prisma
if [[ "$DATABASE_URL" != postgresql://* && "$DATABASE_URL" != postgres://* ]]; then
    echo "⚠️ DATABASE_URL n'a pas le bon format, utilisation de l'URL interne PostgreSQL..."
    # Définir l'URL PostgreSQL interne comme fallback
    export DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@postgresql-database-q84so88cwcskg80og0wo4ck0:5432/postgres"
    echo "✅ Utilisation de l'URL de connexion interne: ${DATABASE_URL:0:15}... (tronqué pour sécurité)"
fi

# Vérifier le contenu du schéma Prisma
echo "📄 Contenu du schéma Prisma :"
cat ./prisma/schema.prisma

# Tester la connexion à la base de données
echo "Test de connexion à la base de données..."
npx prisma db execute --stdin <<EOF
SELECT 1;
EOF

# Statut du test de connexion
DB_STATUS=$?
if [ $DB_STATUS -eq 0 ]; then
    echo "✅ Connexion à la base de données réussie!"
else
    echo "❌ ERREUR: Échec de connexion à la base de données (code: $DB_STATUS)"
fi

# Démarrer l'application avec redirection des erreurs
echo "Démarrage de l'application..."
node dist/index.js 2>&1 | tee /tmp/app.log
