-- Suivi des personnes côté client invitées à consulter un projet (au-delà du
-- client principal via projects.client_profile_id). Comme agency_invites,
-- c'est un suivi manuel : pas de création de compte Supabase Auth automatique
-- (nécessiterait une clé service-role côté serveur), l'agence crée le compte
-- de son côté puis peut mettre à jour le statut.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

create table project_client_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  email text not null,
  full_name text not null,
  status text not null default 'en_attente' check (status in ('en_attente', 'acceptee')),
  invited_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table project_client_invites enable row level security;

create policy "project_client_invites: agence voit tout"
  on project_client_invites for select
  using (is_agence());

create policy "project_client_invites: agence peut créer"
  on project_client_invites for insert
  with check (is_agence());

create policy "project_client_invites: agence peut supprimer"
  on project_client_invites for delete
  using (is_agence());
