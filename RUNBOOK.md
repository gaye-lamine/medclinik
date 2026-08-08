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
