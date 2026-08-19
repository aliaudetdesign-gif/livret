-- Création de compte réelle depuis l'app (agence + client), au lieu du suivi
-- manuel précédent (agency_invites/project_client_invites servaient jusqu'ici
-- de simple checklist, sans compte Supabase Auth créé et sans que le statut
-- "acceptee" ne soit jamais posé automatiquement).
--
-- profile_id trace le compte réellement créé à partir de l'invitation, une
-- fois que le code applicatif (clé service-role, voir lib/supabase/admin.ts)
-- appelle auth.admin.generateLink côté serveur.
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

alter table agency_invites
  add column profile_id uuid references profiles (id) on delete set null;

alter table project_client_invites
  add column profile_id uuid references profiles (id) on delete set null;

-- Policies update : nécessaires si le code applicatif met à jour la ligne
-- d'invitation (statut + profile_id) via le client RLS plutôt que le client
-- admin. Gardées par cohérence avec insert/delete déjà scopés agence.
create policy "agency_invites: agence peut modifier"
  on agency_invites for update
  using (is_agence())
  with check (is_agence());

create policy "project_client_invites: agence peut modifier"
  on project_client_invites for update
  using (is_agence())
  with check (is_agence());
