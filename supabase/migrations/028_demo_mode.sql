-- Mode démo côté agence : un compte recruteur dédié (profiles.is_demo_account)
-- ne doit jamais voir ni modifier les vraies données de l'agence, uniquement
-- les lignes marquées is_demo = true sur projects (et tout ce qui en dépend).
-- Le compte agence réel (Alexandre) garde un accès total aux deux (réel +
-- démo) : c'est le cookie de bascule (lib/demoMode.ts) qui détermine ce qu'il
-- voit à l'écran, pas la RLS.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- 1. Colonnes ---------------------------------------------------------------

alter table projects
  add column if not exists is_demo boolean not null default false;

alter table profiles
  add column if not exists is_demo_account boolean not null default false;

create index if not exists idx_projects_is_demo on projects (is_demo);

-- 2. Fonctions utilitaires ---------------------------------------------------

-- Vrai si le profil connecté est le compte démo recruteur. Security definer
-- pour éviter toute récursion RLS, même logique que is_agence() (migration 003).
create or replace function current_profile_is_demo()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_demo_account from profiles where id = auth.uid()),
    false
  );
$$;

-- Statut démo d'un projet donné (utilisé par les tables qui référencent
-- directement project_id).
create or replace function project_is_demo(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_demo from projects where id = p_project_id),
    false
  );
$$;

-- Statut démo d'une section complémentaire (section_assets ne référence pas
-- project_id directement, mais project_section_id -> project_sections -> projects).
create or replace function section_is_demo(p_project_section_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select projects.is_demo
      from project_sections
      join projects on projects.id = project_sections.project_id
      where project_sections.id = p_project_section_id
    ),
    false
  );
$$;

-- 3. projects -----------------------------------------------------------------

drop policy if exists "projects: agence voit tout" on projects;
create policy "projects: agence voit tout"
  on projects for select
  using (is_agence() and (not current_profile_is_demo() or is_demo));

drop policy if exists "projects: agence peut créer" on projects;
create policy "projects: agence peut créer"
  on projects for insert
  with check (is_agence() and (not current_profile_is_demo() or is_demo));

drop policy if exists "projects: agence peut modifier" on projects;
create policy "projects: agence peut modifier"
  on projects for update
  using (is_agence() and (not current_profile_is_demo() or is_demo))
  with check (is_agence() and (not current_profile_is_demo() or is_demo));

drop policy if exists "projects: agence peut supprimer définitivement" on projects;
create policy "projects: agence peut supprimer définitivement"
  on projects for delete
  using (is_agence() and (not current_profile_is_demo() or is_demo));

-- 4. brand_assets ---------------------------------------------------------------

drop policy if exists "brand_assets: agence voit tout" on brand_assets;
create policy "brand_assets: agence voit tout"
  on brand_assets for select
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "brand_assets: agence peut créer" on brand_assets;
create policy "brand_assets: agence peut créer"
  on brand_assets for insert
  with check (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "brand_assets: agence peut modifier" on brand_assets;
create policy "brand_assets: agence peut modifier"
  on brand_assets for update
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)))
  with check (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "brand_assets: agence peut supprimer" on brand_assets;
create policy "brand_assets: agence peut supprimer"
  on brand_assets for delete
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

-- 5. messages ---------------------------------------------------------------

drop policy if exists "messages: agence voit tout" on messages;
create policy "messages: agence voit tout"
  on messages for select
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "messages: agence peut écrire" on messages;
create policy "messages: agence peut écrire"
  on messages for insert
  with check (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "messages: agence peut modifier" on messages;
create policy "messages: agence peut modifier"
  on messages for update
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)))
  with check (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

-- 6. project_documents -----------------------------------------------------------

drop policy if exists "project_documents: agence voit tout" on project_documents;
create policy "project_documents: agence voit tout"
  on project_documents for select
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "project_documents: agence peut créer" on project_documents;
create policy "project_documents: agence peut créer"
  on project_documents for insert
  with check (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "project_documents: agence peut modifier" on project_documents;
create policy "project_documents: agence peut modifier"
  on project_documents for update
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)))
  with check (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "project_documents: agence peut supprimer" on project_documents;
create policy "project_documents: agence peut supprimer"
  on project_documents for delete
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

-- 7. project_sections -------------------------------------------------------------

drop policy if exists "project_sections: agence voit tout" on project_sections;
create policy "project_sections: agence voit tout"
  on project_sections for select
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "project_sections: agence peut créer" on project_sections;
create policy "project_sections: agence peut créer"
  on project_sections for insert
  with check (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "project_sections: agence peut modifier" on project_sections;
create policy "project_sections: agence peut modifier"
  on project_sections for update
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)))
  with check (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "project_sections: agence peut supprimer" on project_sections;
create policy "project_sections: agence peut supprimer"
  on project_sections for delete
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

-- 8. section_assets ----------------------------------------------------------------

drop policy if exists "section_assets: agence voit tout" on section_assets;
create policy "section_assets: agence voit tout"
  on section_assets for select
  using (is_agence() and (not current_profile_is_demo() or section_is_demo(project_section_id)));

drop policy if exists "section_assets: agence peut créer" on section_assets;
create policy "section_assets: agence peut créer"
  on section_assets for insert
  with check (is_agence() and (not current_profile_is_demo() or section_is_demo(project_section_id)));

drop policy if exists "section_assets: agence peut modifier" on section_assets;
create policy "section_assets: agence peut modifier"
  on section_assets for update
  using (is_agence() and (not current_profile_is_demo() or section_is_demo(project_section_id)))
  with check (is_agence() and (not current_profile_is_demo() or section_is_demo(project_section_id)));

drop policy if exists "section_assets: agence peut supprimer" on section_assets;
create policy "section_assets: agence peut supprimer"
  on section_assets for delete
  using (is_agence() and (not current_profile_is_demo() or section_is_demo(project_section_id)));

-- 9. project_client_invites --------------------------------------------------------

drop policy if exists "project_client_invites: agence voit tout" on project_client_invites;
create policy "project_client_invites: agence voit tout"
  on project_client_invites for select
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "project_client_invites: agence peut créer" on project_client_invites;
create policy "project_client_invites: agence peut créer"
  on project_client_invites for insert
  with check (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

drop policy if exists "project_client_invites: agence peut supprimer" on project_client_invites;
create policy "project_client_invites: agence peut supprimer"
  on project_client_invites for delete
  using (is_agence() and (not current_profile_is_demo() or project_is_demo(project_id)));

-- 10. section_types (bibliothèque partagée, non scopée par projet) -----------------
-- Le compte démo peut choisir dans la bibliothèque existante mais ne doit pas
-- pouvoir y ajouter des entrées : ça polluerait durablement la vraie bibliothèque
-- partagée par tous les projets, réels comme démo.

drop policy if exists "section_types: agence peut créer" on section_types;
create policy "section_types: agence peut créer"
  on section_types for insert
  with check (is_agence() and not current_profile_is_demo());

-- 11. Réglages agence (agency_invites, profil du compte démo lui-même) -------------
-- Ces tables ne sont pas scopées par projet (paramètres globaux de l'agence).
-- Le compte démo peut les consulter (page Réglages visible) mais ne doit rien
-- pouvoir y écrire, pour ne jamais toucher à la vraie équipe/config agence.

drop policy if exists "agency_invites: agence peut créer" on agency_invites;
create policy "agency_invites: agence peut créer"
  on agency_invites for insert
  with check (is_agence() and not current_profile_is_demo());

drop policy if exists "agency_invites: agence peut supprimer" on agency_invites;
create policy "agency_invites: agence peut supprimer"
  on agency_invites for delete
  using (is_agence() and not current_profile_is_demo());

drop policy if exists "profiles: agence modifie son propre profil" on profiles;
create policy "profiles: agence modifie son propre profil"
  on profiles for update
  using (auth.uid() = id and is_agence() and not current_profile_is_demo())
  with check (auth.uid() = id and is_agence() and not current_profile_is_demo());

-- 12. profiles : le compte démo ne doit voir que lui-même et les clients
--     rattachés à un projet démo (pas la vraie liste de clients de l'agence).

drop policy if exists "profiles: agence voit tout" on profiles;
create policy "profiles: agence voit tout"
  on profiles for select
  using (
    is_agence()
    and (
      not current_profile_is_demo()
      or id = auth.uid()
      or exists (
        select 1 from projects
        where projects.client_profile_id = profiles.id
        and projects.is_demo = true
      )
    )
  );
