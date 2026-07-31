# Livret — plateforme web

Application Next.js + Supabase pour l'espace agence et l'espace client de Livret.

## Ce qui existe déjà

- Structure complète des pages : espace agence (`/agence/...`) et espace client (`/espace/...`), avec authentification (`/connexion`).
- Connexion à Supabase préparée (`lib/supabase`), typée (`lib/types.ts`).
- Schéma de base de données prêt à l'emploi (`supabase/schema.sql`) : tables `profiles`, `projects`, `brand_assets`, `messages`, avec sécurité par ligne (RLS) pour séparer ce que voit l'agence de ce que voit chaque client.
- Design system repris de la maquette (couleurs, typographie) dans `app/globals.css`.

Ce qui manque encore : les formulaires d'écriture (créer un projet, envoyer un message, importer un fichier). Le schéma les anticipe mais rien n'est branché côté interface pour l'instant.

## Étape 1 — Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com), connecte-toi avec le compte que tu as créé.
2. Crée un nouveau projet (choisis un nom, un mot de passe de base de données, une région proche de toi).
3. Une fois le projet prêt, ouvre l'onglet **SQL Editor** dans le menu de gauche.
4. Colle le contenu du fichier `supabase/schema.sql` et exécute-le. Ça crée toutes les tables nécessaires.
5. Va dans **Project Settings > API**. Tu y trouveras deux informations à copier :
   - **Project URL**
   - **anon public key**

## Étape 2 — Connecter le projet à Supabase

1. Duplique le fichier `.env.local.example` et renomme la copie `.env.local`.
2. Remplace les deux valeurs par celles copiées à l'étape 1 :

```
NEXT_PUBLIC_SUPABASE_URL=ton-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta-anon-key
```

Ce fichier ne doit jamais être partagé publiquement (il n'est pas envoyé sur GitHub, c'est normal).

## Étape 3 — Lancer le projet en local

Dans un terminal, à la racine du dossier `livret` :

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000). Tu devrais atterrir sur l'écran de connexion.

Pour l'instant, aucun compte n'existe encore dans Supabase : il faudra en créer un manuellement (onglet **Authentication** du projet Supabase, puis ajouter une ligne correspondante dans la table `profiles` avec le bon `role` : `agence` ou `client`).

## Étape 4 — Mettre le code sur GitHub

1. Sur GitHub, crée un nouveau dépôt (vide, sans README).
2. Dans le terminal, à la racine du projet :

```bash
git init
git add .
git commit -m "Premier commit"
git branch -M main
git remote add origin URL_DE_TON_DEPOT
git push -u origin main
```

## Étape 5 — Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com), connecte-toi avec ton compte GitHub.
2. Clique sur **Add New > Project**, choisis le dépôt que tu viens de créer.
3. Dans les réglages du projet, ajoute les deux variables d'environnement (mêmes valeurs que dans `.env.local`) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique sur **Deploy**. Vercel construit et met en ligne le site automatiquement.

Chaque fois que tu pousseras du code sur GitHub par la suite, Vercel redéploiera tout seul.

## Prochaines étapes côté produit

Voir `Parcours-utilisateur.md` pour la liste des écrans encore à concevoir et les flux critiques restants (formulaires de création, envoi de messages, import de fichiers).
