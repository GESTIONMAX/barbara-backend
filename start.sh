#!/bin/sh
echo "=== DÉMARRAGE DE BARBARA BACKEND ==="
echo "Vérification des variables d'environnement essentielles :"
echo "DATABASE_URL: ${DATABASE_URL:0:15}... (tronqué pour sécurité)"
echo "NODE_ENV: $NODE_ENV"
echo "JWT_SECRET: ${JWT_SECRET:0:3}... (tronqué pour sécurité)"
echo "FRONTEND_URL: $FRONTEND_URL"
echo "PORT: $PORT"

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
