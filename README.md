# Airbnkey

Application web de location d’appartements à Cannes, construite avec [Next.js](https://nextjs.org) (App Router), React, TypeScript, Tailwind CSS et shadcn/ui.

## Développement

```bash
pnpm install
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans le navigateur.

## Build

```bash
pnpm build
pnpm start
```

## Restaurer la BDD de prod

Cette restauration recharge les données de la table `Apartment` depuis un backup local généré dans `backups/prod-backup-*/database-public-schema.json`.

> Attention: la commande supprime d'abord toutes les lignes actuelles de `Apartment` puis réinsère le contenu du backup.

### Commande (backup le plus récent)

```bash
node scripts/restore-prod-db-from-backup.mjs --yes-i-understand
```

### Commande (backup précis)

```bash
node scripts/restore-prod-db-from-backup.mjs --backup=/home/livingst/dev/airbnkey/backups/prod-backup-2026-05-13T22-29-32-841Z --yes-i-understand
```

Pré-requis:
- `DATABASE_URL` doit pointer vers la base de production à restaurer.
- Par sécurité, le script refuse une restauration si l'hôte `DATABASE_URL` ne correspond pas à l'hôte enregistré dans le backup. Pour une migration volontaire vers un autre hôte, ajouter `--allow-cross-database-restore`.
- Vérifier que le serveur local n'exécute pas d'opérations d'écriture en parallèle pendant la restauration.

## Déploiement Vercel

### Variables d'environnement minimales

- `DATABASE_URL` : URL PostgreSQL utilisée par Prisma et les server actions.
- `NEXT_PUBLIC_SITE_URL` : URL publique du site (ex. `https://airbnkey.vercel.app`).

En production avec un domaine personnalisé, cette variable doit être l’URL canonique (ex. `https://airbnkey.fr`) : elle pilote les redirections OAuth (`sign-in` + `/auth/callback`) et les métadonnées. Pensez à **redéployer** après modification (`NEXT_PUBLIC_*` est intégré au build côté client).

### Variables optionnelles

- `NEXT_PUBLIC_MAPTILER_API_KEY` : active le fond MapTiler ; sinon fallback Carto.
- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` : requis pour l'upload image vers Supabase Storage et l'auth sociale.
- `SUPABASE_SERVICE_ROLE_KEY` : requis côté serveur pour les uploads image admin vers Supabase Storage.
- `ADMIN_LIST` : emails admin autorisés, séparés par des virgules (ex: `admin1@example.com,admin2@example.com`).
- `EMAIL_CEO` : destinataire des messages du formulaire de contact.
- `EMAIL_FROM` : adresse expéditeur Resend (domaine vérifié), ex. `contact@airbnkey.fr`.
- `RESEND_API_KEY` : clé API Resend utilisée côté serveur pour envoyer les messages de contact.
- `NEXT_PUBLIC_IMAGE_UPLOAD_FALLBACK=dataurl` : fallback local / debug si l'upload Supabase n'est pas configuré.

### Configuration actuelle DEV + PROD

- Le projet utilise actuellement **un seul projet Supabase de production** (`airbnkey-prod`) pour:
  - localhost (`pnpm dev`)
  - production (`https://airbnkey.fr`)
- Toute écriture locale (admin, uploads, suppressions) impacte immédiatement la prod.
- Conserver des sauvegardes régulières dans `backups/` avant toute opération sensible.
- En prod Vercel, `NEXT_PUBLIC_SITE_URL` doit rester l’URL **canonique** du site (ex. `https://airbnkey.fr`) et matcher le **Site URL** Supabase.

### Auth email (Supabase + Resend)

- Supabase Auth est configuré avec **Custom SMTP** via Resend (Dashboard Supabase > Authentication > Email > SMTP Settings).
- Paramètres SMTP attendus:
  - host: `smtp.resend.com`
  - port: `465`
  - user: `resend`
  - password: clé API Resend (`RESEND_API_KEY`)
  - sender email: `EMAIL_FROM` (domaine vérifié)
- Le réglage **"Prevent use of leaked passwords"** dépend du plan Supabase (Pro+).

### OAuth Google/Facebook/Apple (règles de redirect)

- Côté provider (Google Cloud, Meta, Apple): redirect OAuth vers `https://<supabase-ref>/auth/v1/callback`.
- Côté Supabase **Authentication → URL Configuration** (projet **prod**) :
  - **Site URL** : même origine que `NEXT_PUBLIC_SITE_URL` (ex. `https://airbnkey.fr`). Si cette valeur reste une URL Vercel (`*.vercel.app`), après OAuth l’utilisateur peut être renvoyé sur ce domaine même en ayant ouvert le site sur le nom de domaine custom.
  - **Redirect URLs** : inclure au minimum `https://airbnkey.fr/auth/callback` (et `http://localhost:3000/auth/callback` pour le dev).
- Rappels :
  - DEV: `Site URL = http://localhost:3000`, redirect autorisé `http://localhost:3000/auth/callback`
  - PROD avec domaine custom: `Site URL = https://airbnkey.fr`, redirects `https://airbnkey.fr/auth/callback` (éventuellement `https://www.airbnkey.fr/auth/callback` si utilisé)
- Si un login prod redirige vers localhost, c'est généralement que la prod pointe encore vers le projet Supabase de dev.

### Architecture runtime

- Le layout global ne charge plus les appartements ni le provider client.
- Les appartements sont chargés uniquement sur `/` et `/admin`, ce qui réduit le blast radius d'une panne BDD.
- Les lectures fraîches passent par une seule couche Prisma côté serveur, et les pages RSC utilisent la lecture cache taggée.

### Checklist avant `git push`

```bash
pnpm lint
pnpm build
```

Puis :

1. Créer une migration en dev: `pnpm db:migrate:dev --name <description>`.
2. Tester localement et committer `prisma/migrations/*`.
3. Vérifier le statut migration: `pnpm db:migrate:status`.
4. Appliquer en production (URL de session pooler `:5432`, pas transaction pooler `:6543`):
   ```bash
   DATABASE_URL="$(node -e 'require(\"dotenv\").config(); const u=process.env.DATABASE_URL||\"\"; console.log(u.replace(\":6543/\",\":5432/\") + (u.includes(\"?\")?\"&\":\"?\") + \"sslmode=require\")')" pnpm db:migrate:deploy
   ```
5. Déployer l'app sur Vercel.
6. Vérifier le login OAuth et les droits admin whitelist en prod.

### Note production

Le site est accessible sans login. L'auth sociale (Google/Facebook/Apple) est optionnelle côté utilisateur, mais requise pour activer le mode admin. Seuls les emails présents dans `ADMIN_LIST` peuvent accéder aux mutations admin, et le toggle admin reste manuel dans l'UI.
