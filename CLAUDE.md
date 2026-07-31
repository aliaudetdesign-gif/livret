# Livret — contexte projet

Ce fichier sert de point d'entrée pour toute nouvelle session Claude sur ce projet. À lire en priorité avant toute action.

## Qui est l'utilisateur

Alexandre, product designer UX/UI junior, en recherche d'emploi. Non-développeur : il pilote le projet via Claude, ne code pas lui-même. Toujours lui parler en français, direct, sans reformuler sa demande, et présenter un plan avant de modifier des fichiers.

## Ce qu'est le projet

Livret est une maquette Figma/PDF transformée en véritable plateforme web pour une agence de design et ses clients. Objectif final : un outil où l'agence gère ses projets clients (branding, livrables, suivi) et où chaque client a un espace pour suivre l'avancement de son projet (logos, couleurs, typographies, moodboard, documents administratifs, messagerie).

Stack : Next.js 16 (App Router), React 19, Tailwind CSS v4, Supabase (auth + DB Postgres + Storage), Server Actions (pas d'API routes REST). `pdfjs-dist` pour le rendu PDF, `lucide-react` pour les icônes.

Le projet n'est ni versionné avec Git, ni déployé (pas de Vercel, pas de CI) au 31 juillet 2026. Tout tourne en local (`npm run dev`).

## Charte graphique — à respecter impérativement

Les tokens sont définis dans `app/globals.css` sous `:root`. **Ne jamais utiliser les couleurs Tailwind par défaut** (`bg-blue-500`, `text-gray-700`, etc.) : elles cassent l'identité visuelle du projet. Toujours passer par `bg-[var(--color-...)]` ou les classes utilitaires ci-dessous.

Palette :

| Token | Valeur | Usage |
|---|---|---|
| `--background` / `--color-creme` | `#f7f3ec` | Fond global |
| `--foreground` / `--color-noir-doux` | `#1c1c1c` | Texte principal |
| `--color-terracotta` | `#d85a30` | Couleur d'accent, actions primaires |
| `--color-terracotta-deep` | `#a83e1d` | Fin de gradient, hover |
| `--color-terracotta-tint` | `#fbe4da` | Fonds légers, badges |
| `--color-terracotta-glow` | `rgba(216, 90, 48, 0.18)` | Ombres portées |
| `--color-olive` | `#4a5a3a` | Couleur secondaire |
| `--color-sable` | `#d4a47a` | Couleur secondaire |
| `--color-brun` | `#8b5e3c` | Couleur secondaire |
| `--color-lin` | `#e8dfd2` | Bordures, séparateurs, fonds de cartes |

Gradient : `--gradient-terracotta` = `linear-gradient(135deg, terracotta, terracotta-deep)`.

Classes utilitaires maison disponibles : `.bg-gradient-terracotta`, `.text-gradient-terracotta` (gradient appliqué au texte), `.hover-lift` (translation -2px + ombre terracotta au survol, transition 0.2s).

Typographie : Geist et Geist Mono chargées via `next/font/google` dans `app/layout.tsx`, exposées en `--font-geist-sans` et `--font-geist-mono`, mappées sur `--font-sans` et `--font-mono` dans le bloc `@theme inline`.

Le titre du produit s'écrit `livret.` en minuscules, avec le point (voir `metadata` dans `app/layout.tsx`).

## Maquettes de référence

Les maquettes Figma exportées se trouvent dans un dossier séparé, `Livret finale` (sur le Desktop d'Alexandre, monté en parallèle du projet). Une vingtaine de PNG : dashboards agence et client, pages logos / couleurs / typographies / moodboard, structure générale, widgets, composants, mockups de présentation, plus deux HEIC de parcours utilisateur.

C'est la source visuelle de référence. En cas de doute sur la mise en page attendue d'un écran, lire la maquette correspondante avant d'improviser. Attention : l'implémentation a évolué au-delà des maquettes sur plusieurs points (statuts de projet, corbeille, invitations), donc le code prime en cas de contradiction.

## Installation et lancement

```
npm install     # le postinstall copie pdf.worker.min.mjs dans public/
npm run dev
```

Le script `postinstall` de `package.json` copie `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` vers `public/pdf.worker.min.mjs`. **Sans ce fichier, le rendu PDF échoue silencieusement.** Si le viewer PDF ne s'affiche plus, vérifier sa présence en premier.

Variables d'environnement dans `.env.local` (jamais versionné, modèle dans `.env.local.example`) :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

À récupérer dans Supabase : Project Settings > API. Pas de clé service-role disponible, ce qui explique plusieurs limitations documentées plus bas (migrations manuelles, invitations client non automatisées).

## État d'avancement réel

Le projet est **bien plus avancé** que ce que décrivent `README.md` et `Parcours-utilisateur.md` à la racine : ces deux fichiers sont obsolètes, ils décrivent un état très amont (schéma à 4 tables, formulaires "manquants"). Ne pas s'y fier pour juger de l'avancement. La vraie source de vérité : `app/`, `supabase/schema.sql` + `supabase/migrations/`, et `lib/types.ts`.

### Côté agence (`app/agence/`)
Routes : `dashboard`, `projets` (liste, création, fiche projet complète avec assets de marque, sections de design personnalisées, documents, brief, progression en 5 étapes, invitations client), `administratif`, `messagerie`, `parametres`, `profil`, `corbeille` (soft-delete), `aide`.

### Côté client (`app/espace/`)
Routes : `dashboard`, `logos`, `couleurs`, `typographies`, `moodboard`, `design` (sections dynamiques), `administratif`, `messagerie`, `profil`.

### Racine
`app/page.tsx` (accueil), `app/connexion/` (authentification unique agence + client), `app/profil/actions.ts` (Server Actions de profil partagées entre les deux espaces, il n'y a pas de page à cette adresse).

`middleware.ts` ne fait pas de protection de routes : il rafraîchit le token Supabase à chaque requête. Sans lui, le token expire au bout d'environ 1h et les policies RLS échouent silencieusement (`is_agence()` renvoie `false`) alors que les pages semblent s'afficher normalement. L'appel `getUser()` est protégé par un timeout de 5s pour éviter une page blanche si Supabase ne répond pas. Ne pas simplifier ce fichier sans comprendre ces deux garde-fous.

### Fonctionnalités notables déjà en place
- Authentification unique (agence + client) via `app/connexion/`.
- Soft-delete généralisé (corbeille) sur projets, assets de marque, documents, sections, section assets — restauration ou suppression définitive depuis `app/agence/corbeille/`.
- Statuts de projet (en cours / attente de validation / livré) et barre de progression à 5 checkpoints, éditables depuis le menu ⋮ sur chaque `ProjectCard` ou le header de la fiche projet.
- Invitations client par email (suivi manuel en base, `project_client_invites` — pas de création automatique de compte Supabase Auth, ça demanderait une clé service-role).
- Duplication des assets de marque et documents administratifs quand on crée un nouveau projet pour un client existant.

### Convention technique établie
- RLS Supabase via la fonction `is_agence()` (security definer).
- Pattern corbeille : `TrashItemType` union + `TABLE_BY_TYPE` + helpers génériques `restoreItem`/`permanentlyDeleteItem`/`emptyTrash` dans `app/agence/corbeille/actions.ts`.
- Toute requête de lecture sur `projects` doit filtrer `.is("deleted_at", null)`.
- Menus/dropdowns avec fermeture au clic extérieur : `useState` + `useRef` + `useEffect` sur `mousedown`.
- Actions serveur appelées depuis un composant client : `useTransition` + `router.refresh()`.
- Éléments interactifs imbriqués dans un `<Link>` : `e.preventDefault()` + `e.stopPropagation()` dans le handler enfant.

## Migrations Supabase — état

Fichiers dans `supabase/migrations/`, numérotés, à exécuter manuellement dans Supabase Dashboard > SQL Editor (pas de clé service-role disponible pour automatiser).

Présents : 002 à 018, puis 020. **001 et 019 sont absents** du dossier — à vérifier avec Alexandre si elles ont été appliquées autrement ou si elles manquent réellement.

`020_projects_soft_delete.sql` (ajoute `deleted_at` sur `projects` + policy delete définitive agence) : créée récemment, **statut d'exécution non confirmé** — à vérifier en priorité avec l'utilisateur avant de considérer le soft-delete des projets comme fonctionnel en prod/dev.

## Prochaines étapes probables

- Confirmer l'exécution des migrations 019 (si elle existe) et 020.
- Décider d'une stratégie de déploiement (Vercel recommandé vu la stack Next.js) et d'un suivi de version Git — actuellement absents.
- Mettre à jour ou supprimer `README.md` et `Parcours-utilisateur.md` qui induisent en erreur sur l'avancement réel.
- Continuer à enrichir ce fichier `CLAUDE.md` au fil des sessions : toute nouvelle fonctionnalité livrée, tout changement de convention, doit y être reflété.

## Règles non négociables (rappel)

- Toujours présenter un plan avant de modifier des fichiers, attendre validation.
- Ne jamais supprimer définitivement — utiliser le pattern corbeille existant.
- Aller à l'essentiel, ne pas reformuler la demande avant de répondre.
- Vérifier systématiquement avec `tsc --noEmit` et `eslint` après toute modification de code.
