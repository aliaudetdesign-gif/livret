-- Schéma initial de la plateforme Livret
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- 1. Profils (un profil par utilisateur, lié à auth.users)
create type role as enum ('agence', 'client');
create type project_status as enum ('en_cours', 'attente_validation', 'livre');
create type asset_type as enum ('logo', 'couleur', 'typographie', 'moodboard');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role role not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- 2. Projets clients (créés et gérés par l'agence)
create table projects (
  id uuid primary key default gen_random_uuid(),
  client_profile_id uuid references profiles (id) on delete set null,
  name text not null,
  sector text,
  city text,
  status project_status not null default 'en_cours',
  start_date date,
  end_date date,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Assets de marque (logos, couleurs, typographies, moodboard) rattachés à un projet
create table brand_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  type asset_type not null,
  label text not null,
  value text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 4. Messagerie entre agence et client, rattachée à un projet
create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  sender_profile_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sécurité au niveau des lignes (RLS) : chaque client ne doit voir que ses propres données
alter table profiles enable row level security;
alter table projects enable row level security;
alter table brand_assets enable row level security;
alter table messages enable row level security;

-- Un profil ne peut lire/modifier que sa propre ligne
create policy "profiles: lecture de son propre profil"
  on profiles for select
  using (auth.uid() = id);

-- L'agence voit tous les projets, le client ne voit que le sien
create policy "projects: agence voit tout"
  on projects for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'agence')
  );

create policy "projects: client voit son projet"
  on projects for select
  using (client_profile_id = auth.uid());

-- Même logique pour les assets et les messages, via le projet lié
create policy "brand_assets: agence voit tout"
  on brand_assets for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'agence')
  );

create policy "brand_assets: client voit les siens"
  on brand_assets for select
  using (
    exists (
      select 1 from projects
      where projects.id = brand_assets.project_id
      and projects.client_profile_id = auth.uid()
    )
  );

create policy "messages: agence voit tout"
  on messages for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'agence')
  );

create policy "messages: client voit les siens"
  on messages for select
  using (
    exists (
      select 1 from projects
      where projects.id = messages.project_id
      and projects.client_profile_id = auth.uid()
    )
  );

-- Note : les policies d'écriture (insert/update/delete) seront ajoutées à l'étape
-- où l'on connecte réellement les formulaires (création de projet, ajout d'assets, envoi de message).
