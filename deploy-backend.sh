#!/bin/bash

# Script de déploiement pour MedClinik API sur VPS Hostinger (root@72.60.213.116)
# Usage: ./deploy-backend.sh [staging|production]

ENV=${1:-production}
SERVER_USER="root"
SERVER_HOST="72.60.213.116"
PROJECT_PATH="/var/www/html/apps/medclinik"

echo "🚀 Déploiement de MedClinik API - Environnement: $ENV"
echo "🌐 Serveur: $SERVER_USER@$SERVER_HOST"

# Branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
echo "🌿 Branche actuelle: $CURRENT_BRANCH"

# Pour ce projet, on déploie depuis 'main'
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️ Attention: Vous n'êtes pas sur la branche 'main'"
    read -p "Continuer le déploiement depuis '$CURRENT_BRANCH'? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Charger les variables secrètes locales pour le déploiement
if [ -f backend/.env ]; then
    # Helper pour lire .env en bash
    get_env_var() {
        local var_name=$1
        local value=$(grep -E "^${var_name}=" backend/.env | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        echo "$value"
    }
    VPS_PASSWORD=$(get_env_var "VPS_PASSWORD")
else
    echo "⚠️ Aucun fichier backend/.env trouvé en local."
fi

if [ -z "$VPS_PASSWORD" ]; then
    echo "❌ Erreur: VPS_PASSWORD n'est pas défini dans le fichier backend/.env local."
    exit 1
fi

# Synchronisation locale
echo "🔄 Synchronisation locale et push vers le repository..."
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "ℹ️ Aucune modification à commiter"
git push origin "$CURRENT_BRANCH"

# S'assurer que le répertoire de destination existe et copier le fichier .env local
echo "📤 Copie du fichier .env local vers le serveur..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "mkdir -p $PROJECT_PATH/backend"
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no backend/.env "$SERVER_USER@$SERVER_HOST:$PROJECT_PATH/backend/.env"

# Connexion au serveur et déploiement via Docker Compose
echo "🔗 Connexion au serveur via sshpass et déploiement via Docker Compose..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" << EOF
    set -e
    
    echo "=== 🏗️ Mise à jour sur le serveur ==="
    
    # Créer le répertoire si inexistant
    mkdir -p "$PROJECT_PATH"
    cd "$PROJECT_PATH"
    
    # Initialiser git si nécessaire ou simplement pull
    if [ ! -d ".git" ]; then
        echo "📥 Initialisation du projet sur le serveur..."
        git clone https://github.com/gaye-lamine/medclinik.git .
    else
        echo "📥 Récupération des dernières modifications..."
        git stash || true
        git pull origin "$CURRENT_BRANCH"
    fi
    
    cd backend

    # Vérifier l'existence du fichier .env
    if [ ! -f ".env" ]; then
        echo "⚠️ Fichier .env manquant sur le serveur dans backend/!"
        echo "👉 Assurez-vous de configurer les variables secrètes dans .env sur le serveur."
    fi
    
    # Déploiement via Docker Compose
    echo "🚀 Démarrage des conteneurs avec Docker Compose..."
    docker compose down --remove-orphans || true
    docker compose up -d --build
    
    # Exécuter les migrations Prisma automatiquement
    echo "🗄️ Application des migrations Prisma dans la base de données..."
    docker compose exec -T medclinik-backend npx prisma migrate deploy
    
    echo "=== ✅ Déploiement terminé avec succès! L'API est prête sur http://$SERVER_HOST:3006 ==="
EOF

echo "🏁 Déploiement terminé!"
