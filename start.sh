#!/bin/sh
echo "=== DÉMARRAGE DE BARBARA BACKEND ==="
echo "Vérification des variables d'environnement essentielles :"
echo "DATABASE_URL: $(echo "$DATABASE_URL" | cut -c 1-15)... (tronqué pour sécurité)"
echo "NODE_ENV: $NODE_ENV"
echo "JWT_SECRET: $(echo "$JWT_SECRET" | cut -c 1-3)... (tronqué pour sécurité)"
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
case "$DATABASE_URL" in
  postgresql://*|postgres://*) 
    echo "URL de base de données valide détectée"
    ;;
  *)
    echo "⚠️ DATABASE_URL n'a pas le bon format, essai de plusieurs configurations..."
    
    # Initialiser la variable de succès
    CONNECTION_SUCCESS=0
    
    # Liste de potentiels noms d'hôtes à tester
    HOSTS="postgresql-database-q84so88cwcskg80og0wo4ck0 postgres coolify-postgres postgresql postgres-database database q84so88cwcskg80og0wo4ck0 localhost"
    PORTS="5432 5433 5434"
    
    # Afficher les informations réseau pour diagnostiquer les problèmes de connexion
    echo "--- Informations réseau ---"
    echo "Hostname de ce conteneur: $(hostname)"
    echo "Configuration réseau:"
    ip addr show | grep -E "inet " || echo "Commande ip addr non disponible"
    
    # Vérifier si l'URL publique est disponible
    echo "--- Test de connexion avec l'URL publique ---"
    if [ ! -z "${POSTGRES_URL_PUBLIC}" ]; then
        PUBLIC_URL=$(echo "${POSTGRES_URL_PUBLIC}" | sed 's/^POSTGRES_URL_PUBLIC=//')
        case "$PUBLIC_URL" in
          postgresql://*|postgres://*)
            export DATABASE_URL="$PUBLIC_URL"
            echo "Essai avec l'URL publique: $(echo "$DATABASE_URL" | cut -c 1-15)... (tronqué pour sécurité)"
            echo "SELECT 1;" | npx prisma db execute --stdin > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                echo "✅ Connexion réussie avec l'URL publique!"
                CONNECTION_SUCCESS=1
            fi
            ;;
        esac
    else
        echo "Variable POSTGRES_URL_PUBLIC non définie"
    fi
    
    # Si la connexion avec l'URL publique a échoué, tester d'autres combinaisons
    if [ $CONNECTION_SUCCESS -eq 0 ]; then
        # Tester chaque combinaison d'hôte et de port
        HOST_FOUND=0
        for host in $HOSTS; do
            if [ $HOST_FOUND -eq 1 ]; then
                break
            fi
            for port in $PORTS; do
                URL_TEST="postgresql://postgres:${DB_PASSWORD}@${host}:${port}/postgres"
                echo "Essai avec: $host:$port"
                export DATABASE_URL=$URL_TEST
                echo "SELECT 1;" | npx prisma db execute --stdin > /dev/null 2>&1
                if [ $? -eq 0 ]; then
                    echo "✅ Connexion réussie avec l'hôte: $host sur le port $port"
                    CONNECTION_SUCCESS=1
                    HOST_FOUND=1
                    break
                fi
            done
        done
    fi
    
    # Si aucune connexion n'a réussi, essayer avec des options spéciales
    if [ $CONNECTION_SUCCESS -eq 0 ]; then
        echo "--- Tests avec des options spéciales ---"
        
        # Tester avec l'URL interne et le SSL désactivé
        echo "Test avec SSL désactivé"
        export DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@postgresql-database-q84so88cwcskg80og0wo4ck0:5432/postgres?sslmode=disable"
        echo "SELECT 1;" | npx prisma db execute --stdin > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Connexion réussie avec SSL désactivé"
            CONNECTION_SUCCESS=1
        else
            # Si toujours pas de connexion, tenter la configuration de test direct
            echo "Dernier essai avec l'URL par défaut et affichage des erreurs détaillées"
            export DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@postgresql-database-q84so88cwcskg80og0wo4ck0:5432/postgres"
            echo "SELECT 1;" | npx prisma db execute --stdin
        fi
    fi
    ;;
esac

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
