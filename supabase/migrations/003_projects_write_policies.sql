-- Permet à l'agence de créer des projets, et de voir la liste des profils clients
-- (nécessaire pour le formulaire "Nouveau projet").
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- Fonction utilitaire : vérifie si l'utilisateur connecté a le rôle "agence".
-- En security definer pour éviter toute récursion RLS quand on l'utilise
-- dans une policy de la table profiles elle-même.
create or replace function is_agence()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'agence'
  );
$$;

-- L'agence peut créer des projets
create policy "projects: agence peut créer"
  on projects for insert
  with check (is_agence());

-- L'agence peut voir tous les profils (pour assigner un client à un projet)
create policy "profiles: agence voit tout"
  on profiles for select
  using (is_agence());
