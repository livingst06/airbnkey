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

## Déploiement Vercel

### Variables d'environnement minimales

- `DATABASE_URL` : URL PostgreSQL utilisée par Prisma et les server actions.
- `NEXT_PUBLIC_SITE_URL` : URL publique du site (ex. `https://airbnkey.vercel.app`).

### Variables optionnelles

- `NEXT_PUBLIC_MAPTILER_API_KEY` : active le fond MapTiler ; sinon fallback Carto.
- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` : requis pour l'upload image vers Supabase Storage et l'auth sociale.
- `ADMIN_LIST` : emails admin autorisés, séparés par des virgules (ex: `admin1@example.com,admin2@example.com`).
- `NEXT_PUBLIC_IMAGE_UPLOAD_FALLBACK=dataurl` : fallback local / debug si l'upload Supabase n'est pas configuré.

### Étanchéité DEV / PROD

- Utiliser **deux projets Supabase distincts**:
  - `airbnkey-dev` pour localhost et la base de dev
  - `airbnkey-prod` pour Vercel et la base de prod
- Ne jamais partager les clés `NEXT_PUBLIC_SUPABASE_*` ni `DATABASE_URL` entre dev et prod.
- En prod Vercel, `NEXT_PUBLIC_SITE_URL` doit pointer vers l'URL publique (`https://airbnkey.vercel.app` ou domaine custom).

### OAuth Google/Facebook/Apple (règles de redirect)

- Côté provider (Google Cloud, Meta, Apple): redirect OAuth vers `https://<supabase-ref>/auth/v1/callback`.
- Côté Supabase URL Configuration:
  - DEV: `Site URL = http://localhost:3000`, redirect `http://localhost:3000/auth/callback`
  - PROD: `Site URL = https://airbnkey.vercel.app`, redirect `https://airbnkey.vercel.app/auth/callback`
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
4. Appliquer en production (avec `DATABASE_URL` prod): `pnpm db:migrate:deploy`.
5. Déployer l'app sur Vercel.
6. Vérifier le login OAuth et les droits admin whitelist en prod.

### Note production

Le site est accessible sans login. L'auth sociale (Google/Facebook/Apple) est optionnelle côté utilisateur, mais requise pour activer le mode admin. Seuls les emails présents dans `ADMIN_LIST` peuvent accéder aux mutations admin, et le toggle admin reste manuel dans l'UI.
