-- Réglages agence : abonnement (maquette fonctionnelle, sans paiement réel),
-- infos du compte agence (policy update sur profiles) et gestion des accès
-- (suivi d'invitations, sans création de compte Supabase Auth réelle).
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

create type subscription_status as enum ('actif', 'en_pause', 'annule');
create type invite_status as enum ('en_attente', 'acceptee');

-- 1. Abonnement (une seule ligne exploitée par l'app pour le moment)
create table subscription (
  id uuid primary key default gen_random_uuid(),
  plan_name text not null,
  status subscription_status not null default 'actif',
  price_label text not null,
  renewal_date date,
  created_at timestamptz not null default now()
);

insert into subscription (plan_name, status, price_label, renewal_date)
values ('Studio', 'actif', '49 € / mois', (now() + interval '30 days')::date);

-- 2. Invitations d'accès à l'espace agence (suivi d'intention, pas de création
-- de compte automatique : nécessiterait une clé service-role côté serveur)
create table agency_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  status invite_status not null default 'en_attente',
  invited_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table subscription enable row level security;
alter table agency_invites enable row level security;

create policy "subscription: agence voit"
  on subscription for select
  using (is_agence());

create policy "agency_invites: agence voit tout"
  on agency_invites for select
  using (is_agence());

create policy "agency_invites: agence peut créer"
  on agency_invites for insert
  with check (is_agence());

create policy "agency_invites: agence peut supprimer"
  on agency_invites for delete
  using (is_agence());

-- 3. L'agence peut modifier son propre profil (nom du compte)
create policy "profiles: agence modifie son propre profil"
  on profiles for update
  using (auth.uid() = id and is_agence())
  with check (auth.uid() = id and is_agence());
