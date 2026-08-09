# 📘 Runbook standard de déploiement et de migration de base de données (MedClinik)

Ce document décrit la procédure opérationnelle obligatoire à suivre pour toute modification de la base de données de production ou de staging du projet **MedClinik**.

---

## 1. 💾 Étape 1 : Sauvegarde Préalable de la Base de Production (`pg_dump`)

Avant toute modification de schéma ou exécution de script DDL, créer un dump PostgreSQL horodaté sur le VPS :

```bash
# 1. Créer le dossier de sauvegarde s'il n'existe pas
mkdir -p /var/www/html/apps/medclinik/backups /root/backups

# 2. Exécuter pg_dump depuis le conteneur PostgreSQL
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
docker exec -t medclinik-db pg_dump -U medclinik_user medclinik_db > /var/www/html/apps/medclinik/backups/${TIMESTAMP}-pre-migration.sql
cp /var/www/html/apps/medclinik/backups/${TIMESTAMP}-pre-migration.sql /root/backups/

# 3. Vérifier l'existence et la taille du fichier généré
ls -lh /var/www/html/apps/medclinik/backups/${TIMESTAMP}-pre-migration.sql
```

---

## 2. 🛠️ Étape 2 : Génération de la Migration Prisma en Local (`--create-only`)

En cas de modification du fichier `backend/prisma/schema.prisma`, générer le fichier DDL de migration sans l'exécuter directement :

```bash
cd backend

# Génération du dossier et fichier migration.sql sans application directe
npx prisma migrate dev --name <nom_explicite_migration> --create-only
```

Le fichier SQL est créé sous `backend/prisma/migrations/<timestamp>_<nom>/migration.sql`.

---

## 3. 🔄 Étape 3 : Résolution de la Migration sur le VPS (`migrate resolve`)

Si les requêtes SQL ont déjà été exécutées manuellement sur PostgreSQL ou que le schéma a été ajusté en direct, enregistrer la migration dans la table de suivi `_prisma_migrations` du VPS sans la ré-exécuter :

```bash
# Synchro/Copie du dossier de migration vers le VPS
cd /var/www/html/apps/medclinik/backend

# Enregistrer la migration comme appliquée
docker compose exec -T medclinik-backend npx prisma migrate resolve --applied <nom_explicite_migration>
```

---

## 4. ✅ Étape 4 : Vérification du Statut des Migrations (`migrate status`)

Vérifier qu'aucun décalage (*drift*) n'existe entre le schéma Prisma local et la base de données de production :

```bash
docker compose exec -T medclinik-backend npx prisma migrate status
```

**Résultat attendu** :
> `Database schema is up to date!`

---

## 5. 🔒 Étape 5 : Hygiène Git et Commit du Dossier de Migration

S'assurer qu'aucun script de scratch contenant des identifiants/clés SSH (`scratch/*.js`) n'est suivi par Git, puis committer le dossier de migration :

```bash
# Vérification git status
git status

# Seuls le schéma, le code applicatif et le dossier prisma/migrations/ doivent être staggés
git add .gitignore backend/prisma/schema.prisma backend/prisma/migrations/ backend/src/
git commit -m "feat(database): add migration <nom_explicite_migration>"
```

---

## 6. 🚀 Étape 6 : CI/CD GitHub Actions & Procédure de Secours

### 6.1 Configuration des Secrets GitHub
Dans les paramètres du dépôt GitHub (**Settings > Secrets and variables > Actions**), les 3 secrets suivants doivent être configurés :
- `VPS_HOST` : Adresse IP du serveur VPS (`72.60.213.116`).
- `VPS_USER` : Utilisateur SSH (`root`).
- `VPS_SSH_KEY` : Clé privée SSH autorisée sur le VPS.

### 6.2 Déclenchement & Surveillance du Déploiement
1. Tout `git push origin main` déclenche automatiquement le workflow `.github/workflows/deploy.yml`.
2. **Job 1 (Build & Validate)** : Valide la compilation TypeScript (`npm ci` & `npm run build`). En cas d'erreur de compilation, le déploiement est stoppé immédiatement avant tout impact sur la production.
3. **Job 2 (Deploy)** : Se connecte en SSH au VPS, effectue `git pull origin main`, reconstruit l'image Docker via le cache optimisé (`docker compose up -d --build`), et applique les migrations Prisma en attente (`npx prisma migrate deploy`).
4. **Surveillance** : L'onglet **Actions** de GitHub permet de suivre le déroulement en temps réel.

### 6.3 Procédure de Secours Manuel (Fallback)
Si le pipeline GitHub Actions échoue (ex: problème réseau, indisponibilité de GitHub Actions), exécuter le déploiement manuel sur le VPS :

```bash
# 1. Connexion SSH au VPS
ssh root@72.60.213.116

# 2. Aller dans le dossier du projet et pull les derniers commits
cd /var/www/html/apps/medclinik
git pull origin main

# 3. Reconstruire et relancer les conteneurs backend
cd backend
docker compose up -d --build

# 4. Appliquer les migrations Prisma en attente
docker compose exec -T medclinik-backend npx prisma migrate deploy

# 5. Vérifier la santé du service
docker compose ps
curl -i http://localhost:3010/api/consultations
```

---

## 🔒 Règles de Concurrence et Isolation des Transactions (`billing.service.ts`)

Pour toutes les opérations d'encaissement et d'incrémentation de montants financiers (`pay`), toujours passer le niveau d'isolation `Serializable` à la transaction Prisma :

```typescript
await this.prisma.$transaction(
  async (tx) => {
    // Relecture fraîche dans tx et mise à jour atomique
  },
  { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
);
```

---

## 7. 🔑 Politique de Rotation des Secrets JWT

### 7.1 Historique des Rotations

| Date | Secret | Raison | Opérateur |
|---|---|---|---|
| **2026-08-09 01:55 UTC** | `JWT_SECRET` | Audit : valeur mnémonique faible (`medclinik_secret_key_2026_super_secure`, 38 chars), identique dev=prod depuis création du projet | Antigravity |

**Prochaine rotation `JWT_SECRET` due :** 2026-11-09

### 7.2 Politique de rotation recommandée

| Secret | Fréquence minimale | Déclencheur immédiat |
|---|---|---|
| `JWT_SECRET` | **Trimestrielle** (tous les 3 mois) | Fuite suspectée, départ développeur |
| `DATABASE_URL` (password) | Semestrielle | Fuite suspectée, accès non autorisé |
| `WAVE_WEBHOOK_SECRET` | Annuelle ou si incident | Compromission webhook |
| `WAVE_API_KEY` | Selon politique Wave | Fuite suspectée |

### 7.3 Procédure standard de rotation `JWT_SECRET`

```bash
# Sur le VPS en tant que deployer
ENV_FILE="/var/www/html/apps/medclinik/backend/.env"
COMPOSE_FILE="/var/www/html/apps/medclinik/backend/docker-compose.yml"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# 1. Backup horodaté OBLIGATOIRE avant toute modification
cp "$ENV_FILE" "${ENV_FILE}.backup-pre-jwt-rotation-${TIMESTAMP}"

# 2. Génération d'un nouveau secret fort (128 chars hex = 64 bytes d'entropie)
NEW_SECRET=$(node -e "const c=require('crypto'); console.log(c.randomBytes(64).toString('hex'));")

# 3. Remplacement dans le .env de prod
sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"${NEW_SECRET}\"|" "$ENV_FILE"

# 4. Vérification longueur (doit afficher 141+)
grep "JWT_SECRET=" "$ENV_FILE" | wc -c

# 5. Redémarrage (invalide tous les JWT actifs)
docker compose -f "$COMPOSE_FILE" restart medclinik-backend

# 6. Health check
sleep 5
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" -d '{}'
# → 400 = API opérationnelle

# 7. Mettre à jour le .env dev local avec une valeur DIFFÉRENTE de la prod
```

> ⚠️ **Règle absolue** : les secrets dev et prod ne doivent **jamais** être identiques.

### 7.4 Rollback d'urgence post-rotation

```bash
# UNIQUEMENT urgence technique — JAMAIS si la raison est une fuite confirmée
cp "${ENV_FILE}.backup-pre-jwt-rotation-YYYYMMDDHHMMSS" "$ENV_FILE"
docker compose -f "$COMPOSE_FILE" restart medclinik-backend
```

---

## 8. 🛡️ Étape 8 : Architecture de Déploiement Frontend & Blocage Netlify via Playwright E2E

Afin de garantir qu'aucun déploiement défaillant ne soit mis en ligne sur Netlify (Option c) :

1. **Désactivation du déclenchement continu Netlify (`netlify.toml`) :**
   Le fichier `netlify.toml` contient `[build.ignore] command = "exit 0"`. Netlify ne déploie plus automatiquement sur simple `git push origin main`.
2. **Porte de vérité unique (GitHub Actions `frontend-ci.yml`) :**
   À chaque push sur `main`, GitHub Actions :
   - Installe et génère l'application Next.js (`npm run build`).
   - Exécute les 4 suites de tests E2E Playwright (`navbar-rbac.spec.ts`, `role-redirection.spec.ts`, `agenda-rbac.spec.ts`, `logout-session-isolation.spec.ts`).
3. **Déclenchement du Déploiement par Build Hook / CLI :**
   Si et seulement si **100% des tests Playwright passent**, GitHub Actions déclenche l'URL secrète du Build Hook Netlify (`curl -s -X POST "${{ secrets.NETLIFY_BUILD_HOOK_URL }}"`) ou l'outil CLI Netlify (`npx netlify-cli deploy --dir=frontend/out --prod`).
   Si un seul test échoue, le déploiement Netlify est **immédiatement bloqué** et la version précédente en ligne reste active sans interruption.

