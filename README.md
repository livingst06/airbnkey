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

- `NEXT_PUBLIC_ADMIN_MODE=true` : active la route `/admin` et les actions d'édition.
- `NEXT_PUBLIC_MAPTILER_API_KEY` : active le fond MapTiler ; sinon fallback Carto.
- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` : requis pour l'upload image vers Supabase Storage.
- `NEXT_PUBLIC_IMAGE_UPLOAD_FALLBACK=dataurl` : fallback local / debug si l'upload Supabase n'est pas configuré.

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

1. Vérifier que `DATABASE_URL` pointe vers la bonne base de données de production.
2. Exécuter `pnpm db:push` avant le premier déploiement si le schéma n'est pas encore appliqué.
3. Si la contrainte `position` unique est ajoutée sur une base existante, exécuter d'abord `pnpm db:backfill-positions`.
4. Renseigner les mêmes variables dans Vercel avant le déploiement.
5. Vérifier que `/` et `/admin` lisent bien les appartements après déploiement.

### Note production

En production, les pages qui dépendent réellement de la BDD échouent explicitement si `DATABASE_URL` est absente ou invalide, au lieu de masquer le problème avec une liste vide.
