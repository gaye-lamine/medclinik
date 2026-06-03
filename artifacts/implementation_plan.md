# Déploiement de MedClinik Backend sur Hostinger 🚀

Ce plan décrit les étapes pour packager le backend NestJS de MedClinik dans un conteneur Docker et adapter votre script de déploiement `deploy.sh` pour qu'il fonctionne sur votre VPS Hostinger.

## User Review Required

> [!IMPORTANT]
> Pour que le déploiement réussisse, vous devrez vous assurer de :
> 1. Configurer la variable `DATABASE_URL` (votre base de données PostgreSQL de production) dans le fichier `.env` local avant de lancer le script.
> 2. Pousser le projet MedClinik sur un dépôt Git (Github, Gitlab, etc.) car le script effectue un `git clone`. L'URL du repo dans le script est par défaut `https://github.com/gaye-lamine/medclinik.git`, merci de confirmer si c'est la bonne.

## Open Questions

> [!WARNING]
> 1. **URL du Dépôt Git** : Quelle est l'URL exacte du dépôt Github pour MedClinik ? (ex: `https://github.com/gaye-lamine/medclinik.git`)
> 2. **IP du Serveur** : Confirmez-vous que l'IP de votre VPS Hostinger est bien `72.60.213.116` comme dans votre template ?

## Proposed Changes

### Configuration Docker

#### [NEW] [backend/Dockerfile](file:///Users/mac/Desktop/Workspace/MedClinik/backend/Dockerfile)
- Utilisation de `node:20-alpine` pour une image légère.
- Installation des dépendances, génération du client Prisma.
- Compilation de l'application NestJS (`npm run build`).
- Exposition du port `3006`.

#### [NEW] [backend/docker-compose.yml](file:///Users/mac/Desktop/Workspace/MedClinik/backend/docker-compose.yml)
- Définition du service `medclinik-backend`.
- Mapping du port `3006:3006`.
- Mapping du dossier `uploads` via un volume pour conserver les fichiers entre les redémarrages.

---

### Script de Déploiement

#### [NEW] [deploy-backend.sh](file:///Users/mac/Desktop/Workspace/MedClinik/deploy-backend.sh)
- Adaptation de votre script template pour MedClinik.
- Chemin de destination : `/var/www/html/apps/medclinik`.
- `cd /var/www/html/apps/medclinik/backend` avant d'exécuter `docker compose up -d --build`.
- Application des migrations Prisma automatiquement (`npx prisma migrate deploy` dans le conteneur) après le démarrage !

## Verification Plan

### Manual Verification
- Exécuter `chmod +x deploy-backend.sh`.
- Lancer `./deploy-backend.sh production`.
- Vérifier que l'API est accessible publiquement sur `http://72.60.213.116:3006/`.
