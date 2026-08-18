# Livret — contexte projet

Ce fichier sert de point d'entrée pour toute nouvelle session Claude sur ce projet. À lire en priorité avant toute action.

## Qui est l'utilisateur

Alexandre, product designer UX/UI junior, en recherche d'emploi. Non-développeur : il pilote le projet via Claude, ne code pas lui-même. Toujours lui parler en français, direct, sans reformuler sa demande, et présenter un plan avant de modifier des fichiers.

## Ce qu'est le projet

Livret est une maquette Figma/PDF transformée en véritable plateforme web pour une agence de design et ses clients. Objectif final : un outil où l'agence gère ses projets clients (branding, livrables, suivi) et où chaque client a un espace pour suivre l'avancement de son projet (logos, couleurs, typographies, moodboard, documents administratifs, messagerie).

Stack : Next.js 16 (App Router), React 19, Tailwind CSS v4, Supabase (auth + DB Postgres + Storage), Server Actions (pas d'API routes REST). `pdfjs-dist` pour le rendu PDF, `lucide-react` pour les icônes.

Le projet n'est ni versionné avec Git, ni déployé (pas de Vercel, pas de CI) au 31 juillet 2026. Tout tourne en local (`npm run dev`).

## Charte graphique — à respecter impérativement

**Mise à jour majeure (31 juillet 2026)** : la charte est passée d'une palette plate (crème/terracotta) à un style **liquid glass**, conçu avec Claude Opus. Trois pistes explorées dans `propositions-design/` (A-liquid-glass, B-editorial-espace, C-hybride) ; c'est **la piste A qui a été retenue et intégrée dans le vrai code**, pas juste comme maquette HTML. Référence de vérité : `app/globals.css`, en tête de fichier `Charte livret. — proposition A (liquid glass)`.

Les anciens noms de tokens (`--color-terracotta`, `--color-creme`, etc.) sont conservés en alias vers les nouvelles valeurs, pour que les composants existants continuent de fonctionner sans réécriture systématique. **Ne jamais utiliser les couleurs Tailwind par défaut** (`bg-blue-500`, `text-gray-700`, `bg-zinc-100`, etc.) : elles cassent l'identité visuelle. Un audit (3 août 2026) confirme qu'il n'en reste aucune trace dans le code actif — seul `_Archive/components/ColorSwatch.tsx` (archivé, non utilisé) en contient encore.

Tokens principaux :

| Token | Valeur | Usage |
|---|---|---|
| `--shell` | `#f4f0ea` | Fond global (alias `--background`) |
| `--shell-deep` | `#ebe5dc` | Fond légèrement plus soutenu |
| `--paper` | `#fbf9f6` | Fond "papier" (fallback sans glass, mode réduction transparence) |
| `--line` | `#e4dfd7` | Bordures, séparateurs (alias `--color-lin`) |
| `--ink-900` | `#17161a` | Texte principal (alias `--foreground` / `--color-noir-doux`) |
| `--ink-700` / `--ink-500` / `--ink-400` | — | Texte secondaire, dégradé de gris |
| `--clay-700/600/500/400/100` | `#9c4529` → `#f7dfd4` | Terre cuite, couleur d'accent (alias `--color-terracotta*`) |
| `--sage` | `#5f6e52` | Secondaire (alias `--color-olive`) |
| `--sand` | `#d9b08c` | Secondaire (alias `--color-sable`) |
| `--bark` | `#8a6247` | Secondaire (alias `--color-brun`) |
| `--ok-600/100`, `--err-600/300/100`, `--warn-600/100` | — | États (succès/erreur/attention), contrastes AA vérifiés (commentaires dans le CSS) |

Matière verre : `--glass-fill`, `--glass-fill-soft`, `--glass-edge`, `--glass-blur` (`blur(34px) saturate(185%)`), `--glass-shadow(-soft)`. Classes : `.glass` (cartes, blur fort), `.glass-soft` (blur plus léger), `.mesh` + `.mesh .b1-b4` (nappes de couleur floutées en fond, ce que le verre réfracte), `.grain` (bruit fin en overlay, casse l'effet plastique). Fallback automatique en fond opaque `--paper` si `backdrop-filter` non supporté ou si `prefers-reduced-transparency: reduce`.

Rayons : `--r-xs` à `--r-xl`, exposés à Tailwind via `rounded-chip` / `rounded-field` / `rounded-card` / `rounded-panel` / `rounded-hero` (volontairement pas `rounded-sm/md/lg` pour ne pas casser les `rounded-*` déjà en place ailleurs).

Gradient : `--grad-clay` (alias `--gradient-terracotta`). Classes utilitaires : `.bg-gradient-terracotta`, `.text-gradient-terracotta`, `.btn-clay` (bouton pilule dégradé, hover/active), `.hover-lift` (translation -2px + ombre au survol). Toutes respectent `prefers-reduced-motion: reduce`.

Typographie : Geist et Geist Mono chargées via `next/font/google` dans `app/layout.tsx`, exposées en `--font-geist-sans` et `--font-geist-mono`, mappées sur `--font-sans` et `--font-mono` dans le bloc `@theme inline`.

Le titre du produit s'écrit `livret.` en minuscules, avec le point (voir `metadata` dans `app/layout.tsx`).

### Thème sombre (18 août 2026)

Palette sombre complète ajoutée dans `app/globals.css`, appliquée via une classe `.dark` sur `<html>` (voir section "Thème global" plus bas). Charbon chaud (`#1b1815`) plutôt que noir pur, terre cuite éclaircie pour rester lisible sur fond sombre — reste dans l'identité liquid glass plutôt que de basculer vers un dark mode générique. Tous les alias historiques et les mappings `@theme inline` héritent automatiquement des valeurs sombres via la cascade CSS (résolution des `var()` à l'usage), aucun composant n'a eu besoin d'être modifié.

### Chantier en cours : peaufinage de la fluidité

Le style visuel (couleurs/tokens) est appliqué de façon cohérente partout. Le chantier ouvert le 3 août 2026 porte sur les détails d'interaction qui cassent encore la fluidité attendue d'une interface "liquid glass" : ouverture/fermeture de menus et popovers sans transition (apparition/disparition brutale via rendu conditionnel `{open && (...)}`), à vérifier notamment dans `StatusToggle` et `ProgressBar` (`ProjectProgressControls.tsx`), `ProjectCardMenu`, `InfoPopover`, `Modal`, `NewDiscussionButton`. Rien n'est encore corrigé à ce stade, c'est un audit à démarrer.

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
- Mode démo côté agence (17 août 2026) : interface agence complète dupliquée en scope `is_demo`, isolée par RLS, pour montrer le produit à des recruteurs sans exposer les vraies données. Détails dans la section dédiée ci-dessous.
- Proposition de rendez-vous dans la messagerie (18 août 2026) : agence et client peuvent proposer un rendez-vous (date/heure/lieu optionnel) directement dans le fil de discussion, sur le principe de la négociation d'offre Vinted (proposer → accepter/refuser/recontre-proposer). Détails dans la section dédiée ci-dessous.
- Template de section "Réseaux sociaux" (18 août 2026) : template pré-enregistré supplémentaire dans le picker de `AddSectionForm`, accepte images/PDF/vidéos comme toutes les sections. Détails dans la section dédiée ci-dessous.
- Thème global Clair/Sombre/Automatique (18 août 2026) : réglage utilisateur (agence et client), persisté par profil et appliqué sans flash au chargement. Détails dans la section dédiée ci-dessous.

## Mode démo agence

Objectif : un recruteur peut consulter toute l'interface agence (dashboard, projets, messagerie, corbeille) avec des données de démonstration, sans jamais voir ni pouvoir modifier les vrais projets clients d'Alexandre. Et inversement, Alexandre garde la main pour enrichir cette démo depuis son propre compte, sans que ça touche ses projets réels. Aucune démo côté client (`/espace/*`) : périmètre agence uniquement.

Architecture (migration `028_demo_mode.sql`) :
- `projects.is_demo boolean` porte le flag racine. Les tables enfants (`brand_assets`, `messages`, `project_documents`, `project_sections`, `section_assets`, `project_client_invites`) n'ont pas de colonne `is_demo` propre : leur statut démo se déduit dynamiquement via leur `project_id` (fonctions SQL `project_is_demo()` / `section_is_demo()`), pour ne jamais avoir à le stamper manuellement à chaque insert.
- `profiles.is_demo_account boolean` marque le compte recruteur dédié (un seul, à créer manuellement, voir plus bas).
- RLS : quasi toutes les policies agence suivent le motif `is_agence() and (not current_profile_is_demo() or <ligne_est_démo>)`. Le compte recruteur ne voit et ne modifie donc que des lignes `is_demo = true`, isolation appliquée au niveau base de données. Le compte agence réel (Alexandre) garde accès aux deux, c'est un cookie qui détermine ce qu'il voit à l'écran, pas la RLS.
- `lib/demoMode.ts` : `getDemoScope()` (React `cache()`) renvoie `true`/`false` selon le profil (toujours `true` si `is_demo_account`) ou, sinon, le cookie `livret_demo_mode`.
- Bascule pour Alexandre : widget "Modifier la démo" dans `/agence/profil` (`enterDemoMode()`, pose le cookie, redirige vers le dashboard démo) et bandeau "Quitter la démo" dans `app/agence/layout.tsx` (`exitDemoMode()`, retire le cookie). Les deux actions vivent dans `app/profil/actions.ts`.
- Toutes les requêtes de lecture globales côté agence (`dashboard`, `projets`, `messagerie`, `corbeille`) filtrent désormais par `.eq("is_demo", scope)`, avec jointure `!inner` sur `projects` quand la table n'a pas de lien direct. `createProject` (`app/agence/projets/nouveau/actions.ts`) stampe `is_demo: scope` à la création et limite la duplication de charte/administratif aux projets du même scope. `emptyTrash`/`purgeExpiredTrash` (`app/agence/corbeille/actions.ts`) ne purgent que le scope courant.

**Étape manuelle restante (jamais faite par Claude, pas de clé service-role)** : créer le compte recruteur dédié.
1. Exécuter `supabase/migrations/028_demo_mode.sql` dans Supabase Dashboard > SQL Editor (si pas déjà fait).
2. Supabase Dashboard > Authentication > Users > Add user : créer un compte avec un email/mot de passe dédiés à la démo.
3. Dans la table `profiles`, insérer ou mettre à jour la ligne de ce nouvel utilisateur : `role = 'agence'`, `is_demo_account = true`.
4. Se connecter avec le compte agence réel, aller sur `/agence/profil`, cliquer "Entrer en mode démo", créer au moins un projet pour peupler la démo (il sera automatiquement `is_demo = true`).
5. Communiquer les identifiants du compte recruteur aux personnes concernées — elles se connectent normalement via `/connexion`.

## Rendez-vous dans la messagerie

Objectif : permettre à l'agence et au client de proposer un rendez-vous directement dans une conversation, sans sortir du fil de discussion — analogue à la négociation d'offre Vinted (proposer, accepter, refuser, ou recontre-proposer).

Architecture (migration `029_messages_rendezvous.sql`) :
- `messages.type text` (`'text'` par défaut ou `'rendezvous'`) et `messages.metadata jsonb` (nul pour un message texte). Pour un rendez-vous : `{ date, heure, lieu, status }`, `status` dans `pending` / `accepted` / `declined`.
- Aucune policy RLS supplémentaire : les policies d'update existantes sur `messages` (migrations 004 et 028) sont scopées par projet, pas par expéditeur — un client peut donc accepter/refuser un message envoyé par l'agence, et inversement.
- Chaque proposition est un message indépendant : une recontre-proposition crée un nouveau message `type: 'rendezvous'`, l'ancien reste visible dans l'historique du fil mais n'affiche plus de boutons d'action.

Code :
- `app/agence/messagerie/actions.ts` : `proposeRendezVous` (insertion, réutilisée par le bouton calendrier de `MessageForm` et par le formulaire de recontre-proposition dans `RendezVousCard`) et `respondToRendezVous` (accepte/refuse, met à jour `metadata.status`).
- `components/RendezVousCard.tsx` : carte affichée dans le fil à la place de la bulle classique quand `message.type === 'rendezvous'`. Boutons Accepter/Refuser/Proposer un autre horaire visibles uniquement si `status === 'pending'` et que ce n'est pas l'auteur qui consulte.
- `components/MessageForm.tsx` : bouton calendrier à côté de l'envoi, ouvre un popover (date/heure/lieu) pour lancer une première proposition.
- `lib/types.ts` : `MessageType`, `RendezVousStatus`, `RendezVousMetadata` ajoutés, `Message` étendu avec `type` et `metadata`.

**Statut d'exécution de la migration 029 : non confirmé** — à exécuter manuellement dans Supabase Dashboard > SQL Editor avant que la fonctionnalité soit utilisable en prod/dev (le code applicatif la suppose déjà exécutée, comme pour la 020 et la 028).

## Template de section "Réseaux sociaux"

Objectif : proposer un template pré-enregistré "Réseaux sociaux" dans l'onglet "Voir les templates" de `AddSectionForm`, qui accepte tous les formats déjà supportés (images, PDF, vidéos).

Contexte : ce template existait déjà de façon ad hoc sous le nom "Linkedin" (créé sans template pré-enregistré, juste une section custom) — renommé en "Réseaux sociaux" directement en base par Alexandre (édition manuelle via le menu ⋮ de la section, `section_types` étant une bibliothèque partagée entre projets), puis complété par la vraie entrée template ci-dessous.

Architecture (migration `030_section_template_social.sql`) :
- Un `template` sur `section_types` ne sert qu'à faire apparaître la ligne dans le picker de templates — il ne déclenche aucun rendu spécial. Seul `"figma"` a une branche de rendu dédiée dans `SectionAssetGrid.tsx` ; tous les autres templates (`mockup`, `moodboard`, `illustrations`, `packaging`, `social`) retombent sur la grille générique.
- L'acceptation de formats (images/PDF/vidéos) est une règle fixe côté upload (`SectionAssetUploadForm.tsx` + validation MIME serveur dans `addSectionAsset`, `app/agence/projets/[id]/actions.ts`), indépendante du template. Donc zéro changement de logique d'upload ou de rendu pour ce nouveau template : juste une ligne `section_types` en plus + `"social"` ajouté à `SectionTemplate` (`lib/types.ts`).

## Thème global (Clair / Sombre / Automatique)

Objectif : un réglage de thème utilisateur, accessible en page profil (agence et client), persisté par profil pour suivre l'utilisateur d'un appareil à l'autre, appliqué côté serveur sans flash visuel au chargement.

Architecture (migration `031_theme_preference.sql`) :
- `profiles.theme_preference text` (`'light'` / `'dark'` / `'auto'`, défaut `'auto'`). Type `ThemePreference` dans `lib/types.ts`.
- Cookie miroir `livret_theme` (httpOnly, jamais lu côté client), même principe que `livret_demo_mode` : `lib/themeMode.ts` expose `getThemeCookie()`, lu dans `app/layout.tsx` (Server Component) pour poser la classe `.dark` sur `<html>` avant le premier rendu.
- Cas `"auto"` (préférence système, pas connue côté serveur) : un petit script inline (`AUTO_THEME_SCRIPT` dans `app/layout.tsx`) interroge `prefers-color-scheme` et ajoute la classe `.dark` avant peinture, seulement quand le cookie vaut `"auto"`. `suppressHydrationWarning` sur `<html>` pour éviter le warning de mismatch React dans ce cas précis.
- Palette sombre : entièrement dans `app/globals.css`, bloc `.dark { }` après `:root { }`. Redéfinit uniquement les tokens qui changent (fonds, encre, terre cuite, secondaires, états, matière verre) — tout le reste (alias historiques, mappings `@theme inline`, `--grad-clay`, nappes `.mesh`) hérite automatiquement via la cascade CSS.
- `updateThemePreference(value)` dans `app/profil/actions.ts` : met à jour `profiles.theme_preference` + le cookie miroir. Appelée directement avec la valeur choisie (pas de `FormData`), même convention que `updateProjectStatus`.
- `components/ThemeToggle.tsx` : contrôle segmenté à 3 boutons (Clair/Sombre/Automatique), `useTransition` + `router.refresh()` après l'action — nécessaire ici car le thème vit dans le layout serveur (`<html>`), pas dans un état local du composant. Intégré dans `app/agence/profil/page.tsx` et `app/espace/profil/page.tsx`.

### Convention technique établie
- RLS Supabase via la fonction `is_agence()` (security definer).
- Pattern corbeille : `TrashItemType` union + `TABLE_BY_TYPE` + helpers génériques `restoreItem`/`permanentlyDeleteItem`/`emptyTrash` dans `app/agence/corbeille/actions.ts`.
- Toute requête de lecture sur `projects` doit filtrer `.is("deleted_at", null)`.
- Menus/dropdowns avec fermeture au clic extérieur : `useState` + `useRef` + `useEffect` sur `mousedown`.
- Actions serveur appelées depuis un composant client : `useTransition` + `router.refresh()`.
- Éléments interactifs imbriqués dans un `<Link>` : `e.preventDefault()` + `e.stopPropagation()` dans le handler enfant.

## Migrations Supabase — état

Fichiers dans `supabase/migrations/`, numérotés, à exécuter manuellement dans Supabase Dashboard > SQL Editor (pas de clé service-role disponible pour automatiser).

Présents : 002 à 018, puis 020 à 031. **001 et 019 sont absents** du dossier — à vérifier avec Alexandre si elles ont été appliquées autrement ou si elles manquent réellement.

`020_projects_soft_delete.sql` (ajoute `deleted_at` sur `projects` + policy delete définitive agence) : créée récemment, **statut d'exécution non confirmé** — à vérifier en priorité avec l'utilisateur avant de considérer le soft-delete des projets comme fonctionnel en prod/dev.

`028_demo_mode.sql` (colonnes `is_demo` / `is_demo_account` + RLS mode démo agence) : écrite le 17 août 2026, **statut d'exécution non confirmé** — voir section "Mode démo agence" ci-dessus pour les étapes manuelles restantes. Le code applicatif suppose déjà cette migration exécutée.

`029_messages_rendezvous.sql` (colonnes `type` / `metadata` sur `messages`, propositions de rendez-vous) : écrite le 18 août 2026, **statut d'exécution non confirmé** — voir section "Rendez-vous dans la messagerie" ci-dessus.

`030_section_template_social.sql` (nouvelle entrée `section_types` "Réseaux sociaux") et `031_theme_preference.sql` (colonne `profiles.theme_preference`) : écrites le 18 août 2026, **statut d'exécution non confirmé** — le code applicatif suppose déjà les deux exécutées (le sélecteur de thème et le picker de templates y font référence directement).

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
